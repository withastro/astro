import type { AstroConfig, AstroIntegration, RouteData } from 'astro';
import type { LocalPagesRuntime, LocalWorkersRuntime, RUNTIME } from './utils/local-runtime.js';

import * as fs from 'node:fs';
import * as os from 'node:os';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import { AstroError } from 'astro/errors';
import esbuild from 'esbuild';
import glob from 'tiny-glob';
import { getAdapter } from './getAdapter.js';
import { deduplicatePatterns } from './utils/deduplicatePatterns.js';
import { prepareImageConfig } from './utils/image-config.js';
import { getLocalRuntime, getRuntimeConfig } from './utils/local-runtime.js';
import { prependForwardSlash } from './utils/prependForwardSlash.js';
import { rewriteWasmImportPath } from './utils/rewriteWasmImportPath.js';
import { wasmModuleLoader } from './utils/wasm-module-loader.js';

export type { AdvancedRuntime } from './entrypoints/server.advanced.js';
export type { DirectoryRuntime } from './entrypoints/server.directory.js';
export type Options = {
	mode?: 'directory' | 'advanced';
	functionPerRoute?: boolean;
	imageService?: 'passthrough' | 'cloudflare';
	/** Configure automatic `routes.json` generation */
	routes?: {
		/** Strategy for generating `include` and `exclude` patterns
		 * - `auto`: Will use the strategy that generates the least amount of entries.
		 * - `include`: For each page or endpoint in your application that is not prerendered, an entry in the `include` array will be generated. For each page that is prerendered and whoose path is matched by an `include` entry, an entry in the `exclude` array will be generated.
		 * - `exclude`: One `"/*"` entry in the `include` array will be generated. For each page that is prerendered, an entry in the `exclude` array will be generated.
		 * */
		strategy?: 'auto' | 'include' | 'exclude';
		/** Additional `include` patterns */
		include?: string[];
		/** Additional `exclude` patterns */
		exclude?: string[];
	};
	/**
	 * { mode: 'off' }: current behaviour (wrangler is needed)
	 * { mode: 'local', ... }: adds cf request object, locals bindings, env vars/secrets which are defined by the user to `astro.dev` with `Astro.locals.runtime` / `context.locals.runtime`
	 */
	runtime?:
		| { mode: 'off' }
		| {
				mode: Extract<RUNTIME, { type: 'pages' }>['mode'];
				type: Extract<RUNTIME, { type: 'pages' }>['type'];
				persistTo?: Extract<RUNTIME, { type: 'pages' }>['persistTo'];
				bindings?: Extract<RUNTIME, { type: 'pages' }>['bindings'];
		  }
		| {
				mode: Extract<RUNTIME, { type: 'workers' }>['mode'];
				type: Extract<RUNTIME, { type: 'workers' }>['type'];
				persistTo?: Extract<RUNTIME, { type: 'workers' }>['persistTo'];
		  };
	wasmModuleImports?: boolean;
};

interface BuildConfig {
	server: URL;
	client: URL;
	assets: string;
	serverEntry: string;
	split?: boolean;
}

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;
	let _buildConfig: BuildConfig;
	let _localRuntime: LocalPagesRuntime | LocalWorkersRuntime;
	let _entryPoints = new Map<RouteData, URL>();

	const SERVER_BUILD_FOLDER = '/$server_build/';

	const isModeDirectory = args?.mode === 'directory';
	const functionPerRoute = args?.functionPerRoute ?? false;

	const runtimeMode = getRuntimeConfig(args?.runtime);

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({ command, config, updateConfig, logger }) => {
				updateConfig({
					build: {
						client: new URL(`.${config.base}`, config.outDir),
						server: new URL(`.${SERVER_BUILD_FOLDER}`, config.outDir),
						serverEntry: '_worker.mjs',
						redirects: false,
					},
					vite: {
						// load .wasm files as WebAssembly modules
						plugins: [
							wasmModuleLoader({
								disabled: !args?.wasmModuleImports,
								assetsDirectory: config.build.assets,
							}),
						],
					},
					image: prepareImageConfig(args?.imageService ?? 'DEFAULT', config.image, command, logger),
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter({ isModeDirectory, functionPerRoute }));
				_config = config;
				_buildConfig = config.build;

				if (_config.output === 'static') {
					throw new AstroError(
						'[@astrojs/cloudflare] `output: "server"` or `output: "hybrid"` is required to use this adapter. Otherwise, this adapter is not necessary to deploy a static site to Cloudflare.'
					);
				}

				if (_config.base === SERVER_BUILD_FOLDER) {
					throw new AstroError(
						'[@astrojs/cloudflare] `base: "${SERVER_BUILD_FOLDER}"` is not allowed. Please change your `base` config to something else.'
					);
				}
			},
			'astro:server:setup': ({ server, logger }) => {
				if (runtimeMode.mode === 'local') {
					server.middlewares.use(async function middleware(req, res, next) {
						_localRuntime = getLocalRuntime(_config, runtimeMode, logger);

						const bindings = await _localRuntime.getBindings();
						const secrets = await _localRuntime.getSecrets();
						const caches = await _localRuntime.getCaches();
						const cf = await _localRuntime.getCF();

						const clientLocalsSymbol = Symbol.for('astro.locals');
						Reflect.set(req, clientLocalsSymbol, {
							runtime: {
								env: {
									CF_PAGES_URL: `http://${req.headers.host}`,
									...bindings,
									...secrets,
								},
								cf: cf,
								caches: caches,
								waitUntil: (_promise: Promise<any>) => {
									return;
								},
							},
						});
						next();
					});
				}
			},
			'astro:server:done': async ({ logger }) => {
				if (_localRuntime) {
					logger.info('Cleaning up the local Cloudflare runtime.');
					await _localRuntime.dispose();
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
					vite.ssr ||= {};
					vite.ssr.target = 'webworker';

					// Cloudflare env is only available per request. This isn't feasible for code that access env vars
					// in a global way, so we shim their access as `process.env.*`. We will populate `process.env` later
					// in its fetch handler.
					vite.define = {
						'process.env': 'process.env',
						...vite.define,
					};
				}
			},
			'astro:build:ssr': ({ entryPoints }) => {
				_entryPoints = entryPoints;
			},
			'astro:build:done': async ({ pages, routes, dir }) => {
				const functionsUrl = new URL('functions/', _config.root);
				const assetsUrl = new URL(_buildConfig.assets, _buildConfig.client);

				if (isModeDirectory) {
					await fs.promises.mkdir(functionsUrl, { recursive: true });
				}

				// TODO: remove _buildConfig.split in Astro 4.0
				if (isModeDirectory && (_buildConfig.split || functionPerRoute)) {
					const entryPointsURL = [..._entryPoints.values()];
					const entryPaths = entryPointsURL.map((entry) => fileURLToPath(entry));
					const outputUrl = new URL('$astro', _buildConfig.server);
					const outputDir = fileURLToPath(outputUrl);
					//
					// Sadly, when wasmModuleImports is enabled, this needs to build esbuild for each depth of routes/entrypoints
					// independently so that relative import paths to the assets are the correct depth of '../' traversals
					// This is inefficient, so wasmModuleImports is opt-in. This could potentially be improved in the future by
					// taking advantage of the esbuild "onEnd" hook to rewrite import code per entry point relative to where the final
					// destination of the entrypoint is
					const entryPathsGroupedByDepth = !args.wasmModuleImports
						? [entryPaths]
						: entryPaths
								.reduce((sum, thisPath) => {
									const depthFromRoot = thisPath.split(sep).length;
									sum.set(depthFromRoot, (sum.get(depthFromRoot) || []).concat(thisPath));
									return sum;
								}, new Map<number, string[]>())
								.values();

					for (const pathsGroup of entryPathsGroupedByDepth) {
						// for some reason this exports to "entry.pages" on windows instead of "pages" on unix environments.
						// This deduces the name of the "pages" build directory
						const pagesDirname = relative(fileURLToPath(_buildConfig.server), pathsGroup[0]).split(
							sep
						)[0];
						const absolutePagesDirname = fileURLToPath(new URL(pagesDirname, _buildConfig.server));
						const urlWithinFunctions = new URL(
							relative(absolutePagesDirname, pathsGroup[0]),
							functionsUrl
						);
						const relativePathToAssets = relative(
							dirname(fileURLToPath(urlWithinFunctions)),
							fileURLToPath(assetsUrl)
						);
						await esbuild.build({
							target: 'es2022',
							platform: 'browser',
							conditions: ['workerd', 'worker', 'browser'],
							external: [
								'node:assert',
								'node:async_hooks',
								'node:buffer',
								'node:crypto',
								'node:diagnostics_channel',
								'node:events',
								'node:path',
								'node:process',
								'node:stream',
								'node:string_decoder',
								'node:util',
								'cloudflare:*',
							],
							entryPoints: pathsGroup,
							outbase: absolutePagesDirname,
							outdir: outputDir,
							allowOverwrite: true,
							format: 'esm',
							bundle: true,
							minify: _config.vite?.build?.minify !== false,
							banner: {
								js: `globalThis.process = {
									argv: [],
									env: {},
								};`,
							},
							logOverride: {
								'ignored-bare-import': 'silent',
							},
							plugins: !args?.wasmModuleImports
								? []
								: [rewriteWasmImportPath({ relativePathToAssets })],
						});
					}

					const outputFiles: Array<string> = await glob(`**/*`, {
						cwd: outputDir,
						filesOnly: true,
					});

					// move the files into the functions folder
					// & make sure the file names match Cloudflare syntax for routing
					for (const outputFile of outputFiles) {
						const path = outputFile.split(sep);

						const finalSegments = path.map((segment) =>
							segment
								.replace(/(\_)(\w+)(\_)/g, (_, __, prop) => {
									return `[${prop}]`;
								})
								.replace(/(\_\-\-\-)(\w+)(\_)/g, (_, __, prop) => {
									return `[[${prop}]]`;
								})
						);

						finalSegments[finalSegments.length - 1] = finalSegments[finalSegments.length - 1]
							.replace('entry.', '')
							.replace(/(.*)\.(\w+)\.(\w+)$/g, (_, fileName, __, newExt) => {
								return `${fileName}.${newExt}`;
							});

						const finalDirPath = finalSegments.slice(0, -1).join(sep);
						const finalPath = finalSegments.join(sep);

						const newDirUrl = new URL(finalDirPath, functionsUrl);
						await fs.promises.mkdir(newDirUrl, { recursive: true });

						const oldFileUrl = new URL(`$astro/${outputFile}`, outputUrl);
						const newFileUrl = new URL(finalPath, functionsUrl);
						await fs.promises.rename(oldFileUrl, newFileUrl);
					}
				} else {
					const entryPath = fileURLToPath(new URL(_buildConfig.serverEntry, _buildConfig.server));
					const entryUrl = new URL(_buildConfig.serverEntry, _config.outDir);
					const buildPath = fileURLToPath(entryUrl);
					// A URL for the final build path after renaming
					const finalBuildUrl = pathToFileURL(buildPath.replace(/\.mjs$/, '.js'));

					await esbuild.build({
						target: 'es2022',
						platform: 'browser',
						conditions: ['workerd', 'worker', 'browser'],
						external: [
							'node:assert',
							'node:async_hooks',
							'node:buffer',
							'node:crypto',
							'node:diagnostics_channel',
							'node:events',
							'node:path',
							'node:process',
							'node:stream',
							'node:string_decoder',
							'node:util',
							'cloudflare:*',
						],
						entryPoints: [entryPath],
						outfile: buildPath,
						allowOverwrite: true,
						format: 'esm',
						bundle: true,
						minify: _config.vite?.build?.minify !== false,
						banner: {
							js: `globalThis.process = {
								argv: [],
								env: {},
							};`,
						},
						logOverride: {
							'ignored-bare-import': 'silent',
						},
						plugins: !args?.wasmModuleImports
							? []
							: [
									rewriteWasmImportPath({
										relativePathToAssets: isModeDirectory
											? relative(fileURLToPath(functionsUrl), fileURLToPath(assetsUrl))
											: relative(fileURLToPath(_buildConfig.client), fileURLToPath(assetsUrl)),
									}),
							  ],
					});

					// Rename to worker.js
					await fs.promises.rename(buildPath, finalBuildUrl);

					if (isModeDirectory) {
						const directoryUrl = new URL('[[path]].js', functionsUrl);
						await fs.promises.rename(finalBuildUrl, directoryUrl);
					}
				}

				// throw the server folder in the bin
				const serverUrl = new URL(_buildConfig.server);
				await fs.promises.rm(serverUrl, { recursive: true, force: true });

				// move cloudflare specific files to the root
				const cloudflareSpecialFiles = ['_headers', '_redirects', '_routes.json'];

				if (_config.base !== '/') {
					for (const file of cloudflareSpecialFiles) {
						try {
							await fs.promises.rename(
								new URL(file, _buildConfig.client),
								new URL(file, _config.outDir)
							);
						} catch (e) {
							// ignore
						}
					}
				}

				// Add also the worker file so it's excluded from the _routes.json generation
				if (!isModeDirectory) {
					cloudflareSpecialFiles.push('_worker.js');
				}

				const routesExists = await fs.promises
					.stat(new URL('./_routes.json', _config.outDir))
					.then((stat) => stat.isFile())
					.catch(() => false);

				// this creates a _routes.json, in case there is none present to enable
				// cloudflare to handle static files and support _redirects configuration
				if (!routesExists) {
					/**
					 * These route types are candiates for being part of the `_routes.json` `include` array.
					 */
					let notFoundIsSSR = false;
					const potentialFunctionRouteTypes = ['endpoint', 'page'];
					const functionEndpoints = routes
						// Certain route types, when their prerender option is set to false, run on the server as function invocations
						.filter((route) => potentialFunctionRouteTypes.includes(route.type) && !route.prerender)
						.map((route) => {
							if (route.component === 'src/pages/404.astro' && route.prerender === false)
								notFoundIsSSR = true;
							const includePattern =
								'/' +
								route.segments
									.flat()
									.map((segment) => (segment.dynamic ? '*' : segment.content))
									.join('/');

							const regexp = new RegExp(
								'^\\/' +
									route.segments
										.flat()
										.map((segment) => (segment.dynamic ? '(.*)' : segment.content))
										.join('\\/') +
									'$'
							);

							return {
								includePattern,
								regexp,
							};
						});

					const staticPathList: Array<string> = (
						await glob(`${fileURLToPath(_buildConfig.client)}/**/*`, {
							cwd: fileURLToPath(_config.outDir),
							filesOnly: true,
							dot: true,
						})
					)
						.filter((file: string) => cloudflareSpecialFiles.indexOf(file) < 0)
						.map((file: string) => `/${file.replace(/\\/g, '/')}`);

					for (let page of pages) {
						let pagePath = prependForwardSlash(page.pathname);
						if (_config.base !== '/') {
							const base = _config.base.endsWith('/') ? _config.base.slice(0, -1) : _config.base;
							pagePath = `${base}${pagePath}`;
						}
						staticPathList.push(pagePath);
					}

					const redirectsExists = await fs.promises
						.stat(new URL('./_redirects', _config.outDir))
						.then((stat) => stat.isFile())
						.catch(() => false);

					// convert all redirect source paths into a list of routes
					// and add them to the static path
					if (redirectsExists) {
						const redirects = (
							await fs.promises.readFile(new URL('./_redirects', _config.outDir), 'utf-8')
						)
							.split(os.EOL)
							.map((line) => {
								const parts = line.split(' ');
								if (parts.length < 2) {
									return null;
								} else {
									// convert /products/:id to /products/*
									return (
										parts[0]
											.replace(/\/:.*?(?=\/|$)/g, '/*')
											// remove query params as they are not supported by cloudflare
											.replace(/\?.*$/, '')
									);
								}
							})
							.filter(
								(line, index, arr) => line !== null && arr.indexOf(line) === index
							) as string[];

						if (redirects.length > 0) {
							staticPathList.push(...redirects);
						}
					}

					const redirectRoutes: [RouteData, string][] = routes
						.filter((r) => r.type === 'redirect')
						.map((r) => {
							return [r, ''];
						});
					const trueRedirects = createRedirectsFromAstroRoutes({
						config: _config,
						routeToDynamicTargetMap: new Map(Array.from(redirectRoutes)),
						dir,
					});
					if (!trueRedirects.empty()) {
						await fs.promises.appendFile(
							new URL('./_redirects', _config.outDir),
							trueRedirects.print()
						);
					}

					staticPathList.push(...routes.filter((r) => r.type === 'redirect').map((r) => r.route));

					const strategy = args?.routes?.strategy ?? 'auto';

					// Strategy `include`: include all function endpoints, and then exclude static paths that would be matched by an include pattern
					const includeStrategy =
						strategy === 'exclude'
							? undefined
							: {
									include: deduplicatePatterns(
										functionEndpoints
											.map((endpoint) => endpoint.includePattern)
											.concat(args?.routes?.include ?? [])
									),
									exclude: deduplicatePatterns(
										staticPathList
											.filter((file: string) =>
												functionEndpoints.some((endpoint) => endpoint.regexp.test(file))
											)
											.concat(args?.routes?.exclude ?? [])
									),
							  };

					// Cloudflare requires at least one include pattern:
					// https://developers.cloudflare.com/pages/platform/functions/routing/#limits
					// So we add a pattern that we immediately exclude again
					if (includeStrategy?.include.length === 0) {
						includeStrategy.include = ['/'];
						includeStrategy.exclude = ['/'];
					}

					// Strategy `exclude`: include everything, and then exclude all static paths
					const excludeStrategy =
						strategy === 'include'
							? undefined
							: {
									include: ['/*'],
									exclude: deduplicatePatterns(staticPathList.concat(args?.routes?.exclude ?? [])),
							  };

					const includeStrategyLength = includeStrategy
						? includeStrategy.include.length + includeStrategy.exclude.length
						: Infinity;

					const excludeStrategyLength = excludeStrategy
						? excludeStrategy.include.length + excludeStrategy.exclude.length
						: Infinity;

					const winningStrategy = notFoundIsSSR
						? excludeStrategy
						: includeStrategyLength <= excludeStrategyLength
						  ? includeStrategy
						  : excludeStrategy;

					await fs.promises.writeFile(
						new URL('./_routes.json', _config.outDir),
						JSON.stringify(
							{
								version: 1,
								...winningStrategy,
							},
							null,
							2
						)
					);
				}
			},
		},
	};
}
