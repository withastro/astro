import { createReadStream, writeFileSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { appendFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
	appendForwardSlash,
	prependForwardSlash,
	removeLeadingForwardSlash,
} from '@astrojs/internal-helpers/path';
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
import { hasWranglerConfig, wranglerTemplate } from './wrangler.js';
import { parse } from 'dotenv';

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
	 * By default, Astro will be configured to use Cloudflare KV to store session data. If you want to use sessions,
	 * you must create a KV namespace and declare it in your wrangler config file. You can do this with the wrangler command:
	 *
	 * ```sh
	 * npx wrangler kv namespace create SESSION
	 * ```
	 *
	 * This will log the id of the created namespace. You can then add it to your `wrangler.json` file like this:
	 *
	 * ```json
	 * {
	 *   "kv_namespaces": [
	 *     {
	 *       "binding": "SESSION",
	 *       "id": "<your kv namespace id here>"
	 *     }
	 *   ]
	 * }
	 * ```
	 * By default, the driver looks for the binding named `SESSION`, but you can override this by providing a different name here.
	 *
	 * See https://developers.cloudflare.com/kv/concepts/kv-namespaces/ for more details on using KV namespaces.
	 *
	 */
	sessionKVBindingName?: string;

	/**
	 * When configured as `cloudflare-binding`, the Cloudflare Images binding will be used to transform images:
	 * - https://developers.cloudflare.com/images/transform-images/bindings/
	 *
	 * By default, this will use the "IMAGES" binding name, but this can be customised in your `wrangler.json`:
	 *
	 * ```json
	 * {
	 *   "images": {
	 *     "binding": "IMAGES" // <-- this should match `imagesBindingName`
	 *   }
	 * }
	 * ```
	 *
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

function wrapWithSlashes(path: string): string {
	return prependForwardSlash(appendForwardSlash(path));
}

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;
	let finalBuildOutput: HookParameters<'astro:config:done'>['buildOutput'];

	const cloudflareModulePlugin: PluginOption = cloudflareModuleLoader(
		args?.cloudflareModules ?? true,
	);

	let _routes: IntegrationResolvedRoute[];

	const SESSION_KV_BINDING_NAME = args?.sessionKVBindingName ?? 'SESSION';

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({
				command,
				config,
				updateConfig,
				logger,
				addWatchFile,
				createCodegenDir,
			}) => {
				let session = config.session;

				if (args?.imageService === 'cloudflare-binding') {
					const bindingName = args?.imagesBindingName ?? 'IMAGES';

					logger.info(
						`Enabling image processing with Cloudflare Images for production with the "${bindingName}" Images binding.`,
					);
					logger.info(
						`If you see the error "Invalid binding \`${bindingName}\`" in your build output, you need to add the binding to your wrangler config file.`,
					);
				}

				if (!session?.driver) {
					logger.info(
						`Enabling sessions with Cloudflare KV with the "${SESSION_KV_BINDING_NAME}" KV binding.`,
					);
					logger.info(
						`If you see the error "Invalid binding \`${SESSION_KV_BINDING_NAME}\`" in your build output, you need to add the binding to your wrangler config file.`,
					);

					session = {
						...session,
						driver: 'cloudflare-kv-binding',
						options: {
							binding: SESSION_KV_BINDING_NAME,
							...session?.options,
						},
					};
				}
				const cfPluginConfig: PluginConfig = { viteEnvironment: { name: 'ssr' } };
				if (!hasWranglerConfig(config.root)) {
					const codegenDir = createCodegenDir();
					const cachedFile = new URL('wrangler.json', codegenDir);
					writeFileSync(cachedFile, wranglerTemplate(), 'utf-8');
					cfPluginConfig.configPath = fileURLToPath(cachedFile);

					// Copy .dev.vars to codegen dir if it exists
					const devVarsPath = new URL('.dev.vars', config.root);
					const devVarsCodegenPath = new URL('.dev.vars', codegenDir);
					if (existsSync(devVarsPath)) {
						copyFileSync(devVarsPath, devVarsCodegenPath);
					}
				}

				updateConfig({
					build: {
						client: new URL(`.${wrapWithSlashes(config.base)}`, config.outDir),
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
								resolveId(source) {
									if (source.startsWith('cloudflare:')) {
										return { id: source, external: true };
									}
									return null;
								},
							},
							{
								name: '@astrojs/cloudflare:environment',
								configEnvironment(environmentName, _options) {
									if (environmentName === 'ssr' && _options.optimizeDeps?.noDiscovery === false) {
										return {
											optimizeDeps: {
												exclude: ['unstorage/drivers/cloudflare-kv-binding'],
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
								sessionKVBindingName: SESSION_KV_BINDING_NAME,
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
					const redirectsStat = await stat(new URL('./_redirects', _config.outDir));
					if (redirectsStat.isFile()) {
						redirectsExists = true;
					}
				} catch (_error) {
					redirectsExists = false;
				}

				const redirects: IntegrationResolvedRoute['segments'][] = [];
				if (redirectsExists) {
					const rl = createInterface({
						input: createReadStream(new URL('./_redirects', _config.outDir)),
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
					const routesStat = await stat(new URL('./_routes.json', _config.outDir));
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
							new URL('./_redirects', _config.outDir),
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
