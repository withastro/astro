import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { appendFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { removeLeadingForwardSlash } from '@astrojs/internal-helpers/path';
import { createRedirectsFromAstroRoutes, printAsRedirects } from '@astrojs/underscore-redirects';
import { cloudflare as cfVitePlugin, type PluginConfig } from '@cloudflare/vite-plugin';
import type {
	AstroConfig,
	AstroIntegration,
	HookParameters,
	IntegrationResolvedRoute,
} from 'astro';
import type { PluginOption } from 'vite';
import { cloudflareModuleLoader } from './utils/cloudflare-module-loader.js';
import { createRoutesFile, getParts } from './utils/generate-routes-json.js';
import { type ImageService, setImageConfig } from './utils/image-config.js';
import { createConfigPlugin } from './vite-plugin-config.js';
import {
	cloudflareConfigCustomizer,
	DEFAULT_SESSION_KV_BINDING_NAME,
	DEFAULT_IMAGES_BINDING_NAME,
} from './wrangler.js';
import { parse } from 'dotenv';
import { sessionDrivers } from 'astro/config';

export type { Runtime } from './utils/handler.js';

export type Options = {
	/** Options for handling images. */
	imageService?: ImageService;
	/** Configuration for `_routes.json` generation. A _routes.json file controls when your Function is invoked. This file will include three different properties:
	 *
	 * - version: Defines the version of the schema. Currently there is only one version of the schema (version 1), however, we may add more in the future and aim to be backwards compatible.
	 * - include: Defines routes that will be invoked by Functions. Accepts wildcard behavior.
	 * - exclude: Defines routes that will not be invoked by Functions. Accepts wildcard behavior. `exclude` always take priority over `include`.
	 *
	 * Wildcards match any number of path segments (slashes). For example, `/users/*` will match everything after the `/users/` path.
	 *
	 */
	routes?: {
		/** Extend `_routes.json` */
		extend: {
			/** Paths which should be routed to the SSR function */
			include?: {
				/** Generally this is in pathname format, but does support wildcards, e.g. `/users`, `/products/*` */
				pattern: string;
			}[];
			/** Paths which should be routed as static assets */
			exclude?: {
				/** Generally this is in pathname format, but does support wildcards, e.g. `/static`, `/assets/*`, `/images/avatar.jpg` */
				pattern: string;
			}[];
		};
	};

	/**
	 * Allow bundling cloudflare worker specific file types as importable modules. Defaults to true.
	 * When enabled, allows imports of '.wasm', '.bin', and '.txt' file types
	 *
	 * See https://developers.cloudflare.com/pages/functions/module-support/
	 * for reference on how these file types are exported
	 */
	cloudflareModules?: boolean;

	/**
	 * By default, Astro will be configured to use Cloudflare KV to store session data. The KV namespace
	 * will be automatically provisioned when you deploy.
	 *
	 * By default, the binding is named `SESSION`, but you can override this by providing a different name here.
	 * If you define the binding manually in your wrangler config, Astro will use your configuration instead.
	 *
	 * See https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning for more details.
	 */
	sessionKVBindingName?: string;

	/**
	 * When `imageService` is set to `cloudflare-binding`, the Cloudflare Images binding will be used
	 * to transform images. The binding will be automatically configured for you.
	 *
	 * By default, the binding is named `IMAGES`, but you can override this by providing a different name here.
	 * If you define the binding manually in your wrangler config, Astro will use your configuration instead.
	 *
	 * See https://developers.cloudflare.com/images/transform-images/bindings/ for more details.
	 */
	imagesBindingName?: string;

	/**
	 * This configuration option allows you to specify a custom entryPoint for your Cloudflare Worker.
	 * The entry point is the file that will be executed when your Worker is invoked.
	 * By default, this is set to `@astrojs/cloudflare/entrypoints/server.js` and `['default']`.
	 * @docs https://docs.astro.build/en/guides/integrations-guide/cloudflare/#workerEntryPoint
	 */
	workerEntryPoint?: {
		/**
		 * The path to the entry file. This should be a relative path from the root of your Astro project.
		 * @example`'src/worker.ts'`
		 * @docs https://docs.astro.build/en/guides/integrations-guide/cloudflare/#workerentrypointpath
		 */
		path: string | URL;
		/**
		 * Additional named exports to use for the entry file. Astro always includes the default export (`['default']`). If you need to have other top level named exports use this option.
		 * @example ['MyDurableObject', 'namedExport']
		 * @docs https://docs.astro.build/en/guides/integrations-guide/cloudflare/#workerentrypointnamedexports
		 */
		namedExports?: string[];
	};
};

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;
	let finalBuildOutput: HookParameters<'astro:config:done'>['buildOutput'];

	const cloudflareModulePlugin: PluginOption = cloudflareModuleLoader(
		args?.cloudflareModules ?? true,
	);

	let _routes: IntegrationResolvedRoute[];

	const sessionKVBindingName = args?.sessionKVBindingName ?? DEFAULT_SESSION_KV_BINDING_NAME;
	const imagesBindingName = args?.imagesBindingName ?? DEFAULT_IMAGES_BINDING_NAME;

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({ command, config, updateConfig, logger, addWatchFile }) => {
				let session = config.session;

				if (args?.imageService === 'cloudflare-binding') {
					logger.info(
						`Enabling image processing with Cloudflare Images for production with the "${imagesBindingName}" Images binding.`,
					);
				}

				if (!session?.driver) {
					logger.info(
						`Enabling sessions with Cloudflare KV with the "${sessionKVBindingName}" KV binding.`,
					);

					session = {
						driver: sessionDrivers.cloudflareKVBinding({
							binding: sessionKVBindingName,
						}),
						cookie: session?.cookie,
						ttl: session?.ttl,
					};
				}
				const cfPluginConfig: PluginConfig = {
					viteEnvironment: { name: 'ssr' },
					config: cloudflareConfigCustomizer({
						sessionKVBindingName: args?.sessionKVBindingName,
						imagesBindingName:
							args?.imageService === 'cloudflare-binding' ? args?.imagesBindingName : false,
					}),
				};

				updateConfig({
					build: {
						client: new URL(`./client/`, config.outDir),
						server: new URL('./_worker.js/', config.outDir),
						serverEntry: 'index.js',
						redirects: false,
					},
					session,
					vite: {
						plugins: [
							cfVitePlugin(cfPluginConfig),
							// https://developers.cloudflare.com/pages/functions/module-support/
							// Allows imports of '.wasm', '.bin', and '.txt' file types
							cloudflareModulePlugin,
							{
								name: '@astrojs/cloudflare:cf-imports',
								enforce: 'pre',
								resolveId: {
									filter: {
										id: /^cloudflare:/,
									},
									handler(id) {
										return { id, external: true };
									},
								},
							},
							{
								name: '@astrojs/cloudflare:environment',
								configEnvironment(environmentName, _options) {
									const isServerEnvironment = ['ssr', 'prerender'].includes(environmentName);
									if (isServerEnvironment && _options.optimizeDeps?.noDiscovery === false) {
										return {
											optimizeDeps: {
												include: [
													'astro',
													'astro/runtime/**',
													'astro > html-escaper',
													'astro > mrmime',
													'astro > zod/v4',
													'astro > zod/v4/core',
													'astro > clsx',
													'astro > cssesc',
													'astro > cookie',
													'astro > devalue',
													'astro > @oslojs/encoding',
													'astro > es-module-lexer',
													'astro > unstorage',
													'astro > neotraverse/modern',
													'astro > piccolore',
													'astro/app',
													'astro/compiler-runtime',
												],
												exclude: [
													'unstorage/drivers/cloudflare-kv-binding',
													'astro:*',
													'virtual:astro:*',
													'virtual:astro-cloudflare:*',
												],
											},
										};
									} else if (environmentName === 'client') {
										return {
											optimizeDeps: {
												include: ['astro/runtime/client/dev-toolbar/entrypoint.js'],
											},
										};
									}
								},
							},
							{
								enforce: 'post',
								name: '@astrojs/cloudflare:cf-externals',
								applyToEnvironment: (environment) => environment.name === 'ssr',
								config(conf) {
									if (conf.ssr) {
										// Cloudflare does not support externalizing modules in the ssr environment
										conf.ssr.external = undefined;
										conf.ssr.noExternal = true;
									}
								},
							},
							createConfigPlugin({
								sessionKVBindingName,
							}),
						],
					},
					image: setImageConfig(args?.imageService ?? 'compile', config.image, command, logger),
				});

				addWatchFile(new URL('./wrangler.toml', config.root));
				addWatchFile(new URL('./wrangler.json', config.root));
				addWatchFile(new URL('./wrangler.jsonc', config.root));
			},
			'astro:routes:resolved': ({ routes }) => {
				_routes = routes;
			},
			'astro:config:done': ({ setAdapter, config, buildOutput, injectTypes, logger }) => {
				_config = config;
				finalBuildOutput = buildOutput;

				injectTypes({
					filename: 'cloudflare.d.ts',
					content: '/// <reference types="@astrojs/cloudflare/types.d.ts" />',
				});

				let customWorkerEntryPoint: URL | undefined;
				if (args?.workerEntryPoint && typeof args.workerEntryPoint.path === 'string') {
					const require = createRequire(config.root);
					try {
						customWorkerEntryPoint = pathToFileURL(require.resolve(args.workerEntryPoint.path));
					} catch {
						customWorkerEntryPoint = new URL(args.workerEntryPoint.path, config.root);
					}
				}

				setAdapter({
					name: '@astrojs/cloudflare',
					serverEntrypoint: customWorkerEntryPoint ?? '@astrojs/cloudflare/entrypoints/server.js',
					exports: [...new Set(['default', ...(args?.workerEntryPoint?.namedExports ?? [])])],
					adapterFeatures: {
						edgeMiddleware: false,
						buildOutput: 'server',
					},
					previewEntrypoint: '@astrojs/cloudflare/entrypoints/preview',
					supportedAstroFeatures: {
						serverOutput: 'stable',
						hybridOutput: 'stable',
						staticOutput: 'unsupported',
						i18nDomains: 'experimental',
						sharpImageService: {
							support: 'limited',
							message:
								'Cloudflare does not support sharp at runtime. However, you can configure `imageService: "compile"` to optimize images with sharp on prerendered pages during build time.',
							// For explicitly set image services, we suppress the warning about sharp not being supported at runtime,
							// inferring the user is aware of the limitations.
							suppress: args?.imageService ? 'all' : 'default',
						},
						envGetSecret: 'stable',
					},
				});

				// Assign .dev.vars to process.env so astro:env can find these vars
				const devVarsPath = new URL('.dev.vars', config.root);
				if (existsSync(devVarsPath)) {
					try {
						const data = readFileSync(devVarsPath, 'utf-8');
						const parsed = parse(data);
						Object.assign(process.env, parsed);
					} catch {
						logger.error(
							`Unable to parse .dev.vars, variables will not be available to your application.`,
						);
					}
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.resolve ||= {};
					vite.resolve.alias ||= {};
					vite.ssr ||= {};
					vite.ssr.noExternal = true;

					vite.build ||= {};
					vite.build.rollupOptions ||= {};
					vite.build.rollupOptions.output ||= {};
					vite.build.rollupOptions.external = ['sharp'];

					// @ts-expect-error
					vite.build.rollupOptions.output.banner ||=
						'globalThis.process ??= {}; globalThis.process.env ??= {};';

					// Cloudflare env is only available per request. This isn't feasible for code that access env vars
					// in a global way, so we shim their access as `process.env.*`. This is not the recommended way for users to access environment variables. But we'll add this for compatibility for chosen variables. Mainly to support `@astrojs/db`
					vite.define = {
						'process.env': 'process.env',
						'globalThis.__ASTRO_IMAGES_BINDING_NAME': JSON.stringify(
							args?.imagesBindingName ?? 'IMAGES',
						),
						...vite.define,
					};
				}
			},
			'astro:build:done': async ({ pages, dir, logger, assets }) => {
				let redirectsExists = false;
				try {
					const redirectsStat = await stat(new URL('./_redirects', _config.build.client));
					if (redirectsStat.isFile()) {
						redirectsExists = true;
					}
				} catch (_error) {
					redirectsExists = false;
				}

				const redirects: IntegrationResolvedRoute['segments'][] = [];
				if (redirectsExists) {
					const rl = createInterface({
						input: createReadStream(new URL('./_redirects', _config.build.client)),
						crlfDelay: Number.POSITIVE_INFINITY,
					});

					for await (const line of rl) {
						const parts = line.split(' ');
						if (parts.length >= 2) {
							const p = removeLeadingForwardSlash(parts[0])
								.split('/')
								.filter(Boolean)
								.map((s: string) => {
									const syntax = s
										.replace(/\/:.*?(?=\/|$)/g, '/*')
										// remove query params as they are not supported by cloudflare
										.replace(/\?.*$/, '');
									return getParts(syntax);
								});
							redirects.push(p);
						}
					}
				}

				let routesExists = false;
				try {
					const routesStat = await stat(new URL('./_routes.json', _config.build.client));
					if (routesStat.isFile()) {
						routesExists = true;
					}
				} catch (_error) {
					routesExists = false;
				}

				if (!routesExists) {
					await createRoutesFile(
						_config,
						logger,
						_routes,
						pages,
						redirects,
						args?.routes?.extend?.include,
						args?.routes?.extend?.exclude,
					);
				}

				const trueRedirects = createRedirectsFromAstroRoutes({
					config: _config,
					routeToDynamicTargetMap: new Map(
						Array.from(
							_routes
								.filter((route) => route.type === 'redirect')
								.map((route) => [route, ''] as const),
						),
					),
					dir,
					buildOutput: finalBuildOutput,
					assets,
				});

				if (!trueRedirects.empty()) {
					try {
						await appendFile(
							new URL('./_redirects', _config.build.client),
							printAsRedirects(trueRedirects),
						);
					} catch (_error) {
						logger.error('Failed to write _redirects file');
					}
				}
			},
		},
	};
}
