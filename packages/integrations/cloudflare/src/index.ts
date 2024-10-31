import type { AstroConfig, AstroIntegration, IntegrationRouteData } from 'astro';
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
import astroWhen from '@inox-tools/astro-when';
import { AstroError } from 'astro/errors';
import { getPlatformProxy } from 'wrangler';
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
	platformProxy?: {
		/** Toggle the proxy. Default `undefined`, which equals to `true`. */
		enabled?: boolean;
		/** Path to the configuration file. Default `wrangler.toml`. */
		configPath?: string;
		/** Enable experimental support for JSON configuration. Default `false`. */
		experimentalJsonConfig?: boolean;
		/** Configuration persistence settings. Default '.wrangler/state/v3' */
		persist?: boolean | { path: string };
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

function createPlatformProxy(platformProxy: Options['platformProxy']) {
	return getPlatformProxy({
		configPath: platformProxy?.configPath,
		experimentalJsonConfig: platformProxy?.experimentalJsonConfig ?? false,
		persist: platformProxy?.persist ?? true,
	});
}

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;

	const cloudflareModulePlugin: PluginOption & CloudflareModulePluginExtra = cloudflareModuleLoader(
		args?.cloudflareModules ?? true
	);

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
					integrations: [astroWhen()],
					image: setImageConfig(args?.imageService ?? 'compile', config.image, command, logger),
				});
				addWatchFile(new URL('./wrangler.toml', config.root));
				addWatchFile(new URL('./wrangler.json', config.root));
				addMiddleware({
					entrypoint: '@astrojs/cloudflare/entrypoints/middleware.js',
					order: 'pre',
				});
			},
			'astro:config:done': ({ setAdapter, config, buildOutput, logger }) => {
				if (buildOutput === 'static') {
					logger.warn(
						'[@astrojs/cloudflare] This adapter is intended to be used with server rendered pages, which this project does not contain any of. As such, this adapter is unnecessary.'
					);
				}

				_config = config;

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
						sharpImageService: 'limited',
						envGetSecret: 'experimental',
					},
				});
			},
			'astro:server:setup': async ({ server }) => {
				if ((args?.platformProxy?.enabled ?? true) === true) {
					const platformProxy = await createPlatformProxy(args?.platformProxy);

					setProcessEnv(_config, platformProxy.env);

					const clientLocalsSymbol = Symbol.for('astro.locals');

					server.middlewares.use(async function middleware(req, res, next) {
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
											'`passThroughOnException` is currently not available in Cloudflare Pages. See https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions.'
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

					vite.resolve.conditions ||= [];
					// We need those conditions, previous these conditions where applied at the esbuild step which we removed
					// https://github.com/withastro/astro/pull/7092
					vite.resolve.conditions.push('workerd', 'worker');

					vite.ssr ||= {};
					vite.ssr.target = 'webworker';
					vite.ssr.noExternal = true;

					if (typeof _config.vite.ssr?.external === 'undefined') vite.ssr.external = [];
					if (typeof _config.vite.ssr?.external === 'boolean')
						vite.ssr.external = _config.vite.ssr?.external;
					if (Array.isArray(_config.vite.ssr?.external))
						// `@astrojs/vue` sets `@vue/server-renderer` to external
						// https://github.com/withastro/astro/blob/e648c5575a8774af739231cfa9fc27a32086aa5f/packages/integrations/vue/src/index.ts#L119
						// the cloudflare adapter needs to get all dependencies inlined, we use `noExternal` for that, but any `external` config overrides that
						// therefore we need to remove `@vue/server-renderer` from the external config again
						vite.ssr.external = _config.vite.ssr?.external.filter(
							(entry) => entry !== '@vue/server-renderer'
						);

					vite.build ||= {};
					vite.build.rollupOptions ||= {};
					vite.build.rollupOptions.output ||= {};
					// @ts-expect-error
					vite.build.rollupOptions.output.banner ||=
						'globalThis.process ??= {}; globalThis.process.env ??= {};';

					vite.build.rollupOptions.external = _config.vite.build?.rollupOptions?.external ?? [];

					// Cloudflare env is only available per request. This isn't feasible for code that access env vars
					// in a global way, so we shim their access as `process.env.*`. This is not the recommended way for users to access environment variables. But we'll add this for compatibility for chosen variables. Mainly to support `@astrojs/db`
					vite.define = {
						'process.env': 'process.env',
						...vite.define,
					};
				}
				// we thought that vite config inside `if (target === 'server')` would not apply for client
				// but it seems like the same `vite` reference is used for both
				// so we need to reset the previous conflicting setting
				// in the future we should look into a more robust solution
				if (target === 'client') {
					vite.resolve ||= {};
					vite.resolve.conditions ||= [];
					vite.resolve.conditions = vite.resolve.conditions.filter(
						(c) => c !== 'workerd' && c !== 'worker'
					);

					vite.build ||= {};
					vite.build.rollupOptions ||= {};
					vite.build.rollupOptions.output ||= {};
				}
			},
			'astro:build:done': async ({ pages, routes, dir, logger }) => {
				await cloudflareModulePlugin.afterBuildCompleted(_config);
				const PLATFORM_FILES = ['_headers', '_redirects', '_routes.json'];
				if (_config.base !== '/') {
					for (const file of PLATFORM_FILES) {
						try {
							await rename(new URL(file, _config.build.client), new URL(file, _config.outDir));
						} catch (e) {
							logger.error(
								`There was an error moving ${file} to the root of the output directory.`
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
				} catch (error) {
					redirectsExists = false;
				}

				const redirects: IntegrationRouteData['segments'][] = [];
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
				} catch (error) {
					routesExists = false;
				}

				if (!routesExists) {
					await createRoutesFile(
						_config,
						logger,
						routes,
						pages,
						redirects,
						args?.routes?.extend?.include,
						args?.routes?.extend?.exclude
					);
				}

				const redirectRoutes: [IntegrationRouteData, string][] = [];
				for (const route of routes) {
					if (route.type === 'redirect') redirectRoutes.push([route, '']);
				}

				const trueRedirects = createRedirectsFromAstroRoutes({
					config: _config,
					routeToDynamicTargetMap: new Map(Array.from(redirectRoutes)),
					dir,
				});

				if (!trueRedirects.empty()) {
					try {
						await appendFile(new URL('./_redirects', _config.outDir), trueRedirects.print());
					} catch (error) {
						logger.error('Failed to write _redirects file');
					}
				}
			},
		},
	};
}
