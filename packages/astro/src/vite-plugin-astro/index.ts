import type { SourceDescription } from 'rollup';
import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { PluginMetadata as AstroPluginMetadata } from './types';

import { normalizePath } from 'vite';
import {
	cachedCompilation,
	getCachedCompileResult,
	type CompileProps,
} from '../core/compile/index.js';
import { isRelativePath } from '../core/path.js';
import { normalizeFilename } from '../vite-plugin-utils/index.js';
import { cachedFullCompilation } from './compile.js';
import { handleHotUpdate } from './hmr.js';
import { parseAstroRequest } from './query.js';
export { getAstroMetadata } from './metadata.js';
export type { AstroPluginMetadata };

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

/** Transform .astro files for Vite */
export default function astro({ settings, logging }: AstroPluginOptions): vite.Plugin[] {
	const { config } = settings;
	let resolvedConfig: vite.ResolvedConfig;

	// Variables for determining if an id starts with /src...
	const srcRootWeb = config.srcDir.pathname.slice(config.root.pathname.length - 1);
	const isBrowserPath = (path: string) => path.startsWith(srcRootWeb) && srcRootWeb !== '/';

	const prePlugin: vite.Plugin = {
		name: 'astro:build',
		enforce: 'pre', // run transforms before other plugins can
		configResolved(_resolvedConfig) {
			resolvedConfig = _resolvedConfig;
		},
		async load(id, opts) {
			const parsedId = parseAstroRequest(id);
			const query = parsedId.query;
			if (!query.astro) {
				return null;
			}
			// For CSS / hoisted scripts, the main Astro module should already be cached
			const filename = normalizePath(normalizeFilename(parsedId.filename, config.root));
			const compileResult = getCachedCompileResult(config, filename);
			if (!compileResult) {
				return null;
			}

			switch (query.type) {
				case 'style': {
					if (typeof query.index === 'undefined') {
						throw new Error(`Requests for Astro CSS must include an index.`);
					}

					const code = compileResult.css[query.index];
					if (!code) {
						throw new Error(`No Astro CSS at index ${query.index}`);
					}

					return {
						code,
						meta: {
							vite: {
								isSelfAccepting: true,
							},
						},
					};
				}
				case 'script': {
					if (typeof query.index === 'undefined') {
						throw new Error(`Requests for hoisted scripts must include an index`);
					}
					// HMR hoisted script only exists to make them appear in the module graph.
					if (opts?.ssr) {
						return {
							code: `/* client hoisted script, empty in SSR: ${id} */`,
						};
					}

					const hoistedScript = compileResult.scripts[query.index];
					if (!hoistedScript) {
						throw new Error(`No hoisted script at index ${query.index}`);
					}

					if (hoistedScript.type === 'external') {
						const src = hoistedScript.src;
						if (src.startsWith('/') && !isBrowserPath(src)) {
							const publicDir = config.publicDir.pathname.replace(/\/$/, '').split('/').pop() + '/';
							throw new Error(
								`\n\n<script src="${src}"> references an asset in the "${publicDir}" directory. Please add the "is:inline" directive to keep this asset from being bundled.\n\nFile: ${id}`
							);
						}
					}

					const result: SourceDescription = {
						code: '',
						meta: {
							vite: {
								lang: 'ts',
							},
						},
					};

					switch (hoistedScript.type) {
						case 'inline': {
							const { code, map } = hoistedScript;
							result.code = appendSourceMap(code, map);
							break;
						}
						case 'external': {
							const { src } = hoistedScript;
							result.code = `import "${src}"`;
							break;
						}
					}

					return result;
				}
				default:
					return null;
			}
		},
		async transform(source, id) {
			const parsedId = parseAstroRequest(id);
			// ignore astro file sub-requests, e.g. Foo.astro?astro&type=script&index=0&lang.ts
			if (!id.endsWith('.astro') || parsedId.query.astro) {
				return;
			}
			// if we still get a relative path here, vite couldn't resolve the import
			if (isRelativePath(parsedId.filename)) {
				return;
			}

			const compileProps: CompileProps = {
				astroConfig: config,
				viteConfig: resolvedConfig,
				filename: normalizePath(parsedId.filename),
				source,
			};

			const transformResult = await cachedFullCompilation({ compileProps, logging });

			for (const dep of transformResult.cssDeps) {
				this.addWatchFile(dep);
			}

			const astroMetadata: AstroPluginMetadata['astro'] = {
				clientOnlyComponents: transformResult.clientOnlyComponents,
				hydratedComponents: transformResult.hydratedComponents,
				scripts: transformResult.scripts,
				containsHead: transformResult.containsHead,
				propagation: 'none',
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
		async handleHotUpdate(context) {
			if (context.server.config.isProduction) return;
			const compileProps: CompileProps = {
				astroConfig: config,
				viteConfig: resolvedConfig,
				filename: context.file,
				source: await context.read(),
			};
			const compile = () => cachedCompilation(compileProps);
			return handleHotUpdate(context, {
				config,
				logging,
				compile,
				source: compileProps.source,
			});
		},
	};

	const normalPlugin: vite.Plugin = {
		name: 'astro:build:normal',
		resolveId(id) {
			// If Vite resolver can't resolve the Astro request, it's likely a virtual Astro file, fallback here instead
			const parsedId = parseAstroRequest(id);
			if (parsedId.query.astro) {
				return id;
			}
		},
	};

	return [prePlugin, normalPlugin];
}

function appendSourceMap(content: string, map?: string) {
	if (!map) return content;
	return `${content}\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
		map
	).toString('base64')}`;
}
