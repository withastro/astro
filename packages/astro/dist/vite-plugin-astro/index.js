import { defaultClientConditions, defaultServerConditions, normalizePath } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { isAstroServerEnvironment } from '../environments.js';
import { normalizeFilename, specialQueriesRE } from '../vite-plugin-utils/index.js';
import { compileAstro } from './compile.js';
import { compileAstro as compileAstroRs } from './compile-rs.js';
import { handleHotUpdate } from './hmr.js';
import { parseAstroRequest } from './query.js';
import { loadId } from './utils.js';
import { getAstroMetadata } from './metadata.js';
const astroFileToCompileMetadataWeakMap = /* @__PURE__ */ new WeakMap();
function astro({ settings, logger }) {
	const { config } = settings;
	let server;
	let compile;
	let astroFileToCompileMetadata = /* @__PURE__ */ new Map();
	const srcRootWeb = config.srcDir.pathname.slice(config.root.pathname.length - 1);
	const isBrowserPath = (path) => path.startsWith(srcRootWeb) && srcRootWeb !== '/';
	const notAstroComponent = (component) => !component.resolvedPath.endsWith('.astro');
	return [
		{
			name: 'astro:build:css-hmr',
			enforce: 'pre',
			applyToEnvironment(environment) {
				return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
			},
			transform: {
				filter: {
					id: {
						include: [/(?:\?|&)astro(?:&|=|$)/],
						// ignore astro file sub-requests, e.g. Foo.astro?astro&type=script&index=0&lang.ts
						exclude: [specialQueriesRE],
					},
				},
				async handler(_source, id) {
					const parsedId = parseAstroRequest(id);
					const astroFilename = normalizePath(normalizeFilename(parsedId.filename, config.root));
					const compileMetadata = astroFileToCompileMetadata.get(astroFilename);
					if (compileMetadata && parsedId.query.type === 'style' && parsedId.query.index != null) {
						const result = compileMetadata.css[parsedId.query.index];
						result.dependencies?.forEach((dep) => this.addWatchFile(dep));
					}
				},
			},
		},
		{
			name: 'astro:build',
			enforce: 'pre',
			// run transforms before other plugins can
			async configEnvironment(name, viteConfig, opts) {
				viteConfig.resolve ??= {};
				if (viteConfig.resolve.conditions == null) {
					if (viteConfig.consumer === 'client' || name === 'client' || opts.isSsrTargetWebworker) {
						viteConfig.resolve.conditions = [...defaultClientConditions];
					} else {
						viteConfig.resolve.conditions = [...defaultServerConditions];
					}
				}
				viteConfig.resolve.conditions.push('astro');
			},
			async configResolved(viteConfig) {
				const toolbarEnabled = await settings.preferences.get('devToolbar.enabled');
				compile = (code, filename) => {
					const compileProps = {
						astroConfig: config,
						viteConfig,
						toolbarEnabled,
						filename,
						source: code,
					};
					if (config.experimental.rustCompiler) {
						return compileAstroRs({
							compileProps,
							astroFileToCompileMetadata,
						});
					}
					return compileAstro({
						compileProps,
						astroFileToCompileMetadata,
						logger,
					});
				};
			},
			configureServer(_server) {
				server = _server;
				server.watcher.on('unlink', (filename) => {
					astroFileToCompileMetadata.delete(filename);
				});
			},
			buildStart() {
				astroFileToCompileMetadata = /* @__PURE__ */ new Map();
				if (astroFileToCompileMetadataWeakMap.has(config)) {
					astroFileToCompileMetadata = astroFileToCompileMetadataWeakMap.get(config);
				} else {
					astroFileToCompileMetadataWeakMap.set(config, astroFileToCompileMetadata);
				}
			},
			load: {
				filter: {
					id: /(?:\?|&)astro(?:&|=|$)/,
				},
				async handler(id) {
					const parsedId = parseAstroRequest(id);
					const query = parsedId.query;
					const filename = normalizePath(normalizeFilename(parsedId.filename, config.root));
					let compileMetadata = astroFileToCompileMetadata.get(filename);
					if (!compileMetadata) {
						if (server) {
							const code = await loadId(server.pluginContainer, filename);
							if (code != null) await compile(code, filename);
						}
						compileMetadata = astroFileToCompileMetadata.get(filename);
					}
					if (!compileMetadata) {
						throw new Error(
							`No cached compile metadata found for "${id}". The main Astro module "${filename}" should have compiled and filled the metadata first, before its virtual modules can be requested.`,
						);
					}
					switch (query.type) {
						case 'style': {
							if (typeof query.index === 'undefined') {
								throw new Error(`Requests for Astro CSS must include an index.`);
							}
							const result = compileMetadata.css[query.index];
							if (!result) {
								throw new Error(`No Astro CSS at index ${query.index}`);
							}
							result.dependencies?.forEach((dep) => this.addWatchFile(dep));
							return {
								code: result.code,
								// `vite.cssScopeTo` is a Vite feature that allows this CSS to be treeshaken
								// if the Astro component's default export is not used
								meta: result.isGlobal
									? void 0
									: {
											vite: {
												cssScopeTo: [filename, 'default'],
											},
										},
							};
						}
						case 'script': {
							if (typeof query.index === 'undefined') {
								throw new Error(`Requests for scripts must include an index`);
							}
							if (isAstroServerEnvironment(this.environment)) {
								return {
									code: `/* client script, empty in SSR: ${id} */`,
								};
							}
							const script = compileMetadata.scripts[query.index];
							if (!script) {
								throw new Error(`No script at index ${query.index}`);
							}
							if (script.type === 'external') {
								const src = script.src;
								if (src.startsWith('/') && !isBrowserPath(src)) {
									const publicDir =
										config.publicDir.pathname.replace(/\/$/, '').split('/').pop() + '/';
									throw new Error(
										`

<script src="${src}"> references an asset in the "${publicDir}" directory. Please add the "is:inline" directive to keep this asset from being bundled.

File: ${id}`,
									);
								}
							}
							const result = {
								code: '',
								meta: {
									vite: {
										lang: 'ts',
									},
								},
							};
							switch (script.type) {
								case 'inline': {
									const { code, map } = script;
									result.code = appendSourceMap(code, map);
									break;
								}
								case 'external': {
									const { src } = script;
									result.code = `import "${src}"`;
									break;
								}
							}
							return result;
						}
						case 'custom':
						case 'template':
						case void 0:
						default:
							return null;
					}
				},
			},
			transform: {
				filter: {
					id: {
						include: [/\.astro$/, /\.astro\?/],
						// ignore astro file sub-requests, e.g. Foo.astro?astro&type=script&index=0&lang.ts
						exclude: [specialQueriesRE, /(?:\?|&)astro(?:&|=|$)/],
					},
				},
				async handler(source, id) {
					const parsedId = parseAstroRequest(id);
					if (!parsedId.filename.endsWith('.astro')) {
						return;
					}
					const filename = normalizePath(parsedId.filename);
					if (this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
						return {
							code: `export default import.meta.env.DEV
									? () => {
											throw new Error(
												'Astro components cannot be used in the browser.\\nTried to render "${filename}".'
											);
										}
									: {};`,
							meta: { vite: { lang: 'ts' } },
						};
					}
					const transformResult = await compile(source, filename);
					const astroMetadata = {
						// Remove Astro components that have been mistakenly given client directives
						// We'll warn the user about this later, but for now we'll prevent them from breaking the build
						clientOnlyComponents: transformResult.clientOnlyComponents.filter(notAstroComponent),
						hydratedComponents: transformResult.hydratedComponents.filter(notAstroComponent),
						serverComponents: transformResult.serverComponents,
						scripts: transformResult.scripts,
						containsHead: transformResult.containsHead,
						propagation: transformResult.propagation ? 'self' : 'none',
						pageOptions: {},
					};
					return {
						code: transformResult.code,
						map: transformResult.map,
						meta: {
							astro: astroMetadata,
							vite: {
								// Setting this vite metadata to `ts` causes Vite to resolve .js
								// extensions to .ts files.
								lang: 'ts',
							},
						},
					};
				},
			},
			async handleHotUpdate(ctx) {
				return handleHotUpdate(ctx, { logger, compile, astroFileToCompileMetadata });
			},
		},
		{
			name: 'astro:build:normal',
			// If Vite resolver can't resolve the Astro request, it's likely a virtual Astro file, fallback here instead
			resolveId: {
				filter: {
					id: /(?:\?|&)astro(?:&|=|$)/,
				},
				handler(id) {
					return id;
				},
			},
		},
	];
}
function appendSourceMap(content, map) {
	if (!map) return content;
	return `${content}${'\n//#'} sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
		map,
	).toString('base64')}`;
}
export { astro as default, getAstroMetadata };
