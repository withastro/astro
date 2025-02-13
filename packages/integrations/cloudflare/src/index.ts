import type {
	AstroConfig,
	AstroIntegration,
	HookParameters,
	IntegrationResolvedRoute,
} from 'astro';
import type { PluginOption } from 'vite';

import { createReadStream } from 'node:fs';
import { appendFile, rename, stat } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import {
	appendForwardSlash,
	prependForwardSlash,
	removeLeadingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import { AstroError } from 'astro/errors';
import { defaultClientConditions } from 'vite';
import { type GetPlatformProxyOptions, getPlatformProxy } from 'wrangler';
import {
	type CloudflareModulePluginExtra,
	cloudflareModuleLoader,
} from './utils/cloudflare-module-loader.js';
import { createGetEnv } from './utils/env.js';
import { createRoutesFile, getParts } from './utils/generate-routes-json.js';
import { setImageConfig } from './utils/image-config.js';

export type { Runtime } from './entrypoints/server.js';

export type Options = {
	/** Options for handling images. */
	imageService?: 'passthrough' | 'cloudflare' | 'compile' | 'custom';
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
	 * Proxy configuration for the platform.
	 */
	platformProxy?: GetPlatformProxyOptions & {
		/** Toggle the proxy. Default `undefined`, which equals to `true`. */
		enabled?: boolean;
	};

	/**
	 * Allow bundling cloudflare worker specific file types as importable modules. Defaults to true.
	 * When enabled, allows imports of '.wasm', '.bin', and '.txt' file types
	 *
	 * See https://developers.cloudflare.com/pages/functions/module-support/
	 * for reference on how these file types are exported
	 */
	cloudflareModules?: boolean;
};

function wrapWithSlashes(path: string): string {
	return prependForwardSlash(appendForwardSlash(path));
}

function setProcessEnv(config: AstroConfig, env: Record<string, unknown>) {
	const getEnv = createGetEnv(env);

	if (config.env?.schema) {
		for (const key of Object.keys(config.env.schema)) {
			const value = getEnv(key);
			if (value !== undefined) {
				process.env[key] = value;
			}
		}
	}
}

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;
	let finalBuildOutput: HookParameters<'astro:config:done'>['buildOutput'];

	const cloudflareModulePlugin: PluginOption & CloudflareModulePluginExtra = cloudflareModuleLoader(
		args?.cloudflareModules ?? true,
	);

	let _routes: IntegrationResolvedRoute[];

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({
				command,
				config,
				updateConfig,
				logger,
				addWatchFile,
				addMiddleware,
			}) => {
				updateConfig({
					build: {
						client: new URL(`.${wrapWithSlashes(config.base)}`, config.outDir),
						server: new URL('./_worker.js/', config.outDir),
						serverEntry: 'index.js',
						redirects: false,
					},
					vite: {
						plugins: [
							// https://developers.cloudflare.com/pages/functions/module-support/
							// Allows imports of '.wasm', '.bin', and '.txt' file types
							cloudflareModulePlugin,
							{
								name: 'vite:cf-imports',
								enforce: 'pre',
								resolveId(source) {
									if (source.startsWith('cloudflare:')) {
										return { id: source, external: true };
									}
									return null;
								},
							},
						],
					},
					image: setImageConfig(args?.imageService ?? 'compile', config.image, command, logger),
				});
				if (args?.platformProxy?.configPath) {
					addWatchFile(new URL(args.platformProxy.configPath, config.root));
				} else {
					addWatchFile(new URL('./wrangler.toml', config.root));
					addWatchFile(new URL('./wrangler.json', config.root));
					addWatchFile(new URL('./wrangler.jsonc', config.root));
				}
				addMiddleware({
					entrypoint: '@astrojs/cloudflare/entrypoints/middleware.js',
					order: 'pre',
				});
			},
			'astro:routes:resolved': ({ routes }) => {
				_routes = routes;
			},
			'astro:config:done': ({ setAdapter, config, buildOutput, logger }) => {
				if (buildOutput === 'static') {
					logger.warn(
						'[@astrojs/cloudflare] This adapter is intended to be used with server rendered pages, which this project does not contain any of. As such, this adapter is unnecessary.',
					);
				}

				_config = config;
				finalBuildOutput = buildOutput;

				setAdapter({
					name: '@astrojs/cloudflare',
					serverEntrypoint: '@astrojs/cloudflare/entrypoints/server.js',
					exports: ['default'],
					adapterFeatures: {
						edgeMiddleware: false,
						buildOutput: 'server',
					},
					supportedAstroFeatures: {
						serverOutput: 'stable',
						hybridOutput: 'stable',
						staticOutput: 'unsupported',
						i18nDomains: 'experimental',
						sharpImageService: {
							support: 'limited',
							message:
								'Cloudflare does not support sharp. You can use the `compile` image service to compile images at build time. It will not work for any on-demand rendered images.',
						},
						envGetSecret: 'stable',
					},
				});
			},
			'astro:server:setup': async ({ server }) => {
				if ((args?.platformProxy?.enabled ?? true) === true) {
					const platformProxy = await getPlatformProxy(args?.platformProxy);

					setProcessEnv(_config, platformProxy.env);

					const clientLocalsSymbol = Symbol.for('astro.locals');

					server.middlewares.use(async function middleware(req, _res, next) {
						Reflect.set(req, clientLocalsSymbol, {
							runtime: {
								env: platformProxy.env,
								cf: platformProxy.cf,
								caches: platformProxy.caches,
								ctx: {
									waitUntil: (promise: Promise<any>) => platformProxy.ctx.waitUntil(promise),
									// Currently not available: https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions
									passThroughOnException: () => {
										throw new AstroError(
											'`passThroughOnException` is currently not available in Cloudflare Pages. See https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions.',
										);
									},
								},
							},
						});
						next();
					});
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.resolve ||= {};
					vite.resolve.alias ||= {};

					const aliases = [
						{
							find: 'react-dom/server',
							replacement: 'react-dom/server.browser',
						},
					];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}

					// Support `workerd` and `worker` conditions for the ssr environment
					// (previously supported in esbuild instead: https://github.com/withastro/astro/pull/7092)
					vite.ssr ||= {};
					vite.ssr.resolve ||= {};
					vite.ssr.resolve.conditions ||= [...defaultClientConditions];
					vite.ssr.resolve.conditions.push('workerd', 'worker');

					vite.ssr.target = 'webworker';
					vite.ssr.noExternal = true;

					vite.build ||= {};
					vite.build.rollupOptions ||= {};
					vite.build.rollupOptions.output ||= {};
					// @ts-expect-error
					vite.build.rollupOptions.output.banner ||=
						'globalThis.process ??= {}; globalThis.process.env ??= {};';

					// Cloudflare env is only available per request. This isn't feasible for code that access env vars
					// in a global way, so we shim their access as `process.env.*`. This is not the recommended way for users to access environment variables. But we'll add this for compatibility for chosen variables. Mainly to support `@astrojs/db`
					vite.define = {
						'process.env': 'process.env',
						...vite.define,
					};
				}
			},
			'astro:build:done': async ({ pages, dir, logger, assets }) => {
				await cloudflareModulePlugin.afterBuildCompleted(_config);
				const PLATFORM_FILES = ['_headers', '_redirects', '_routes.json'];
				if (_config.base !== '/') {
					for (const file of PLATFORM_FILES) {
						try {
							await rename(new URL(file, _config.build.client), new URL(file, _config.outDir));
						} catch (_e) {
							logger.error(
								`There was an error moving ${file} to the root of the output directory.`,
							);
						}
					}
				}

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
						await appendFile(new URL('./_redirects', _config.outDir), trueRedirects.print());
					} catch (_error) {
						logger.error('Failed to write _redirects file');
					}
				}
			},
		},
	};
}
