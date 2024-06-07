import type { AstroConfig, AstroIntegration, RouteData } from 'astro';
import type { OutputChunk, ProgramNode } from 'rollup';
import type { PluginOption } from 'vite';

import { createReadStream } from 'node:fs';
import { appendFile, rename, stat, unlink } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import {
	appendForwardSlash,
	prependForwardSlash,
	removeLeadingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import { AstroError } from 'astro/errors';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { getPlatformProxy } from 'wrangler';
import {
	type CloudflareModulePluginExtra,
	cloudflareModuleLoader,
} from './utils/cloudflare-module-loader.js';
import { createRoutesFile, getParts } from './utils/generate-routes-json.js';
import { setImageConfig } from './utils/image-config.js';
import { mutateDynamicPageImportsInPlace, mutatePageMapInPlace } from './utils/index.js';
import { NonServerChunkDetector } from './utils/non-server-chunk-detector.js';

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
		/** Toggle the proxy. Default `undefined`, which equals to `false`. */
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

	/** @deprecated - use `cloudflareModules`, which defaults to true. You can set `cloudflareModuleLoading: false` to disable */
	wasmModuleImports?: boolean;
};

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;

	const cloudflareModulePlugin: PluginOption & CloudflareModulePluginExtra = cloudflareModuleLoader(
		args?.cloudflareModules ?? args?.wasmModuleImports ?? true
	);

	// Initialize the unused chunk analyzer as a shared state between hooks.
	// The analyzer is used on earlier hooks to collect information about used hooks on a Vite plugin
	// and then later after the full build to clean up unused chunks, so it has to be shared between them.
	const chunkAnalyzer = new NonServerChunkDetector();

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({ command, config, updateConfig, logger }) => {
				updateConfig({
					build: {
						client: new URL(
							`.${prependForwardSlash(appendForwardSlash(config.base))}`,
							config.outDir
						),
						server: new URL('./_worker.js/', config.outDir),
						serverEntry: 'index.js',
						redirects: false,
					},
					vite: {
						// load .wasm files as WebAssembly modules
						plugins: [
							cloudflareModulePlugin,
							chunkAnalyzer.getPlugin(),
							{
								name: 'dynamic-imports-analyzer',
								enforce: 'post',
								generateBundle(_, bundle) {
									let astrojsSSRVirtualEntryAST: ProgramNode | undefined;
									const prerenderImports: string[] = [];
									let entryChunk: OutputChunk | undefined;
									// Find all pages (ignore the ssr entrypoint) which are prerendered based on the dynamic imports of the prerender chunk
									for (const chunk of Object.values(bundle)) {
										if (chunk.type !== 'chunk') continue;
										if (chunk.name === '_@astrojs-ssr-virtual-entry') {
											astrojsSSRVirtualEntryAST = this.parse(chunk.code);
											entryChunk = chunk;
											continue;
										}

										const isPrerendered = chunk.dynamicImports.some((entry) =>
											entry.includes('prerender')
										);
										if (isPrerendered) {
											prerenderImports.push(chunk.fileName);
										}
									}

									if (!astrojsSSRVirtualEntryAST) return;
									if (!entryChunk) return;
									const s = new MagicString(entryChunk.code);

									const constsToRemove: string[] = [];
									walk(astrojsSSRVirtualEntryAST, {
										leave(node) {
											// We are only looking for VariableDeclarations, since both (dynamic imports and pageMap) are declared as constants in the code
											if (node.type !== 'VariableDeclaration') return;
											if (
												!node.declarations[0] ||
												node.declarations[0].type !== 'VariableDeclarator'
											)
												return;

											// This function will remove the dynamic imports from the entrypoint
											mutateDynamicPageImportsInPlace(node, prerenderImports, constsToRemove, s);
											// This function will remove the pageMap entries which are invalid now
											mutatePageMapInPlace(node, constsToRemove, s);
										},
									});
									entryChunk.code = s.toString();
								},
							},
						],
					},
					image: setImageConfig(args?.imageService ?? 'DEFAULT', config.image, command, logger),
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				_config = config;

				if (config.output === 'static') {
					throw new AstroError(
						'[@astrojs/cloudflare] `output: "server"` or `output: "hybrid"` is required to use this adapter. Otherwise, this adapter is not necessary to deploy a static site to Cloudflare.'
					);
				}

				setAdapter({
					name: '@astrojs/cloudflare',
					serverEntrypoint: '@astrojs/cloudflare/entrypoints/server.js',
					exports: ['default'],
					adapterFeatures: {
						functionPerRoute: false,
						edgeMiddleware: false,
					},
					supportedAstroFeatures: {
						serverOutput: 'stable',
						hybridOutput: 'stable',
						staticOutput: 'unsupported',
						i18nDomains: 'experimental',
						assets: {
							supportKind: 'stable',
							isSharpCompatible: false,
							isSquooshCompatible: false,
						},
					},
				});
			},
			'astro:server:setup': async ({ server }) => {
				if (args?.platformProxy?.enabled === true) {
					const platformProxy = await getPlatformProxy({
						configPath: args.platformProxy.configPath ?? 'wrangler.toml',
						experimentalJsonConfig: args.platformProxy.experimentalJsonConfig ?? false,
						persist: args.platformProxy.persist ?? true,
					});

					const clientLocalsSymbol = Symbol.for('astro.locals');

					server.middlewares.use(async function middleware(req, res, next) {
						Reflect.set(req, clientLocalsSymbol, {
							runtime: {
								env: platformProxy.env,
								cf: platformProxy.cf,
								caches: platformProxy.caches,
								ctx: {
									waitUntil: (promise: Promise<any>) => platformProxy.ctx.waitUntil(promise),
									passThroughOnException: () => platformProxy.ctx.passThroughOnException(),
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

					// @ts-expect-error
					vite.build.rollupOptions.output.manualChunks = (id: string) => {
						if (id.includes('node_modules')) {
							if (id.indexOf('node_modules') !== -1) {
								const basic = id.toString().split('node_modules/')[1];
								const sub1 = basic.split('/')[0];
								if (sub1 !== '.pnpm') {
									return sub1.toString();
								}
								const name2 = basic.split('/')[1];
								return name2.split('@')[name2[0] === '@' ? 1 : 0].toString();
							}
						}
					};

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
					// @ts-expect-error
					vite.build.rollupOptions.output.manualChunks = undefined;
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

				const redirects: RouteData['segments'][] = [];
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

				const redirectRoutes: [RouteData, string][] = [];
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

				// Get chunks from the bundle that are not needed on the server and delete them
				// Those modules are build only for prerendering routes.
				const chunksToDelete = chunkAnalyzer.getNonServerChunks();
				for (const chunk of chunksToDelete) {
					try {
						// Chunks are located on `./_worker.js` directory inside of the output directory
						await unlink(new URL(`./_worker.js/${chunk}`, _config.outDir));
					} catch (error) {
						logger.warn(
							`Issue while trying to delete unused file from server bundle: ${new URL(
								`./_worker.js/${chunk}`,
								_config.outDir
							).toString()}`
						);
					}
				}
			},
		},
	};
}
