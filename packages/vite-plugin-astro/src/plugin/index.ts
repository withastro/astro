import type * as vite from 'vite';
import { defaultClientConditions, defaultServerConditions, normalizePath } from 'vite';
import {
	ASTRO_VITE_ENVIRONMENT_NAMES,
	isAstroServerEnvironment,
} from '@astrojs/internal-helpers/environments';
import { normalizeFilename, specialQueriesRE } from '@astrojs/internal-helpers/vite';
import type { Transform } from '../types.js';
import { type CompileAstroResult, compileAstro } from './compile.js';
import { handleHotUpdate } from './hmr.js';
import { parseAstroRequest } from './query.js';
import type {
	AstroComponent,
	AstroPluginMetadata as AstroPluginMetadata,
	CompileMetadata,
} from './types.js';
import { loadId } from './utils.js';
import type { TransformOptions } from '@astrojs/compiler-rs';
import { existsSync } from 'node:fs';
import path from 'node:path';

export { getAstroMetadata } from './metadata.js';
export type { AstroPluginMetadata };

interface AstroPluginOptions
	extends Pick<TransformOptions, 'compact' | 'astroGlobalArgs' | 'scopedStyleStrategy'> {
	annotateSourceFile?: boolean;
	transform?: Transform;
}

// const astroFileToCompileMetadataWeakMap = new WeakMap<
// 	AstroConfigLike,
// 	Map<string, CompileMetadata>
// >();

/** Transform .astro files for Vite */
export default function astro({
	annotateSourceFile = false,
	transform,
	compact,
	astroGlobalArgs,
	scopedStyleStrategy,
}: AstroPluginOptions): vite.Plugin[] {
	let server: vite.ViteDevServer | undefined;
	let compile: (code: string, filename: string) => Promise<CompileAstroResult>;
	// NOTE: We need to initialize a map here and in `buildStart` because our unit tests don't
	// call `buildStart` (test bug)
	let astroFileToCompileMetadata = new Map<string, CompileMetadata>();

	const notAstroComponent = (component: AstroComponent) =>
		!component.resolvedPath.endsWith('.astro');

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
						exclude: [specialQueriesRE],
					},
				},
				async handler(_source, id) {
					const parsedId = parseAstroRequest(id);
					// Special edge case handling for Vite 6 beta, the style dependencies need to be registered here to take effect
					// TODO: Remove this when Vite fixes it (https://github.com/vitejs/vite/pull/18103)
					const astroFilename = normalizePath(
						normalizeFilename(parsedId.filename, this.environment.config.root),
					);
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
				compile = (code, filename) => {
					return compileAstro({
						compileProps: {
							viteConfig,
							filename,
							source: code,
							annotateSourceFile,
							compact,
							astroGlobalArgs,
							scopedStyleStrategy,
						},
						astroFileToCompileMetadata,
						transform,
					});
				};
			},
			configureServer(_server) {
				server = _server;
				server.watcher.on('unlink', (filename) => {
					astroFileToCompileMetadata.delete(filename);
				});
			},
			// TODO: check if still needed
			// buildStart() {
				// Share the `astroFileToCompileMetadata` across the same Astro config as Astro performs
				// multiple builds and its hoisted scripts analyzer requires the compile metadata from
				// previous builds. Ideally this should not be needed when we refactor hoisted scripts analysis.
				// if (astroFileToCompileMetadataWeakMap.has(config)) {
				// 	astroFileToCompileMetadata = astroFileToCompileMetadataWeakMap.get(config)!;
				// } else {
				// 	astroFileToCompileMetadataWeakMap.set(config, astroFileToCompileMetadata);
				// }
			// },
			load: {
				filter: {
					id: /(?:\?|&)astro(?:&|=|$)/,
				},
				async handler(id) {
					const parsedId = parseAstroRequest(id);
					const query = parsedId.query;

					const filename = normalizePath(
						normalizeFilename(parsedId.filename, this.environment.config.root),
					);
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
							`No cached compile metadata found for "${id}". The main Astro module "${filename}" should have ` +
								`compiled and filled the metadata first, before its virtual modules can be requested.`,
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
								meta: result.isGlobal
									? undefined
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
									moduleType: 'ts',
								};
							}

							const script = compileMetadata.scripts[query.index];
							if (!script) {
								throw new Error(`No script at index ${query.index}`);
							}

							if (script.type === 'external') {
								const src = script.src!;
								const publicDir =
									this.environment.config.publicDir.replace(/\/$/, '').split('/').pop() + '/';
								if (
									src.startsWith('/') &&
									existsSync(path.join(this.environment.config.root, publicDir, src))
								) {
									throw new Error(
										`\n\n<script src="${src}"> references an asset in the "${publicDir}" directory. Please add the "is:inline" directive to keep this asset from being bundled.\n\nFile: ${id}`,
									);
								}
							}

							const result: vite.Rolldown.SourceDescription = {
								code: '',
								moduleType: 'ts',
								meta: {
									vite: {
										lang: 'ts',
									},
								},
							};

							switch (script.type) {
								case 'inline': {
									result.code = script.code ?? '';
									break;
								}
								case 'external': {
									result.code = `import "${script.src}"`;
									break;
								}
							}

							return result;
						}
						case 'custom':
						case 'template':
						case undefined:
						default:
							return null;
					}
				},
			},
			transform: {
				filter: {
					id: {
						include: [/\.astro$/, /\.astro\?/],
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
							moduleType: 'ts',
							meta: { vite: { lang: 'ts' } },
						};
					}

					const transformResult = await compile(source, filename);

					const astroMetadata: AstroPluginMetadata['astro'] = {
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
						moduleType: 'ts',
						meta: {
							astro: astroMetadata,
							vite: {
								lang: 'ts',
							},
						},
					};
				},
			},
			async handleHotUpdate(ctx) {
				return handleHotUpdate(ctx, { compile, astroFileToCompileMetadata });
			},
		},
		{
			name: 'astro:build:normal',
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
