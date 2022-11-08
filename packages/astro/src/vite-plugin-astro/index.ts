import type { SourceDescription } from 'rollup';
import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { PluginMetadata as AstroPluginMetadata } from './types';

import slash from 'slash';
import { fileURLToPath } from 'url';
import { cachedCompilation, CompileProps, getCachedCompileResult } from '../core/compile/index.js';
import {
	isRelativePath,
	prependForwardSlash,
	removeLeadingForwardSlashWindows,
	startsWithForwardSlash,
} from '../core/path.js';
import { viteID } from '../core/util.js';
import { normalizeFilename } from '../vite-plugin-utils/index.js';
import { cachedFullCompilation } from './compile.js';
import { handleHotUpdate } from './hmr.js';
import { parseAstroRequest, ParsedRequestResult } from './query.js';
export { getAstroMetadata } from './metadata.js';
export type { AstroPluginMetadata };

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

/** Transform .astro files for Vite */
export default function astro({ settings, logging }: AstroPluginOptions): vite.Plugin {
	const { config } = settings;
	let resolvedConfig: vite.ResolvedConfig;

	// Variables for determining if an id starts with /src...
	const srcRootWeb = config.srcDir.pathname.slice(config.root.pathname.length - 1);
	const isBrowserPath = (path: string) => path.startsWith(srcRootWeb) && srcRootWeb !== '/';
	const isFullFilePath = (path: string) =>
		path.startsWith(prependForwardSlash(slash(fileURLToPath(config.root))));

	function relativeToRoot(pathname: string) {
		const arg = startsWithForwardSlash(pathname) ? '.' + pathname : pathname;
		const url = new URL(arg, config.root);
		return slash(fileURLToPath(url)) + url.search;
	}

	function resolveRelativeFromAstroParent(id: string, parsedFrom: ParsedRequestResult): string {
		const filename = normalizeFilename(parsedFrom.filename, config);
		const resolvedURL = new URL(id, `file://${filename}`);
		const resolved = resolvedURL.pathname;
		if (isBrowserPath(resolved)) {
			return relativeToRoot(resolved + resolvedURL.search);
		}
		return slash(fileURLToPath(resolvedURL)) + resolvedURL.search;
	}

	return {
		name: 'astro:build',
		enforce: 'pre', // run transforms before other plugins can
		configResolved(_resolvedConfig) {
			resolvedConfig = _resolvedConfig;
		},
		// note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.glob, etc.)
		async resolveId(id, from, opts) {
			// If resolving from an astro subresource such as a hoisted script,
			// we need to resolve relative paths ourselves.
			if (from) {
				const parsedFrom = parseAstroRequest(from);
				const isAstroScript = parsedFrom.query.astro && parsedFrom.query.type === 'script';
				if (isAstroScript && isRelativePath(id)) {
					return this.resolve(resolveRelativeFromAstroParent(id, parsedFrom), from, {
						custom: opts.custom,
						skipSelf: true,
					});
				}
			}

			// serve sub-part requests (*?astro) as virtual modules
			const { query } = parseAstroRequest(id);
			if (query.astro) {
				// TODO: Try to remove these custom resolve so HMR is more predictable.
				// Convert /src/pages/index.astro?astro&type=style to /Users/name/
				// Because this needs to be the id for the Vite CSS plugin to property resolve
				// relative @imports.
				if (query.type === 'style' && isBrowserPath(id)) {
					return relativeToRoot(id);
				}
				// Strip `/@fs` from linked dependencies outside of root so we can normalize
				// it in the condition below. This ensures that the style module shared the same is
				// part of the same "file" as the main Astro module in the module graph.
				// "file" refers to `moduleGraph.fileToModulesMap`.
				if (query.type === 'style' && id.startsWith('/@fs')) {
					id = removeLeadingForwardSlashWindows(id.slice(4));
				}
				// Convert file paths to ViteID, meaning on Windows it omits the leading slash
				if (isFullFilePath(id)) {
					return viteID(new URL('file://' + id));
				}
				return id;
			}
		},
		async load(id, opts) {
			const parsedId = parseAstroRequest(id);
			const query = parsedId.query;
			if (!query.astro) {
				return null;
			}
			// For CSS / hoisted scripts, the main Astro module should already be cached
			const filename = normalizeFilename(parsedId.filename, config);
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
						const src = hoistedScript.src!;
						if (src.startsWith('/') && !isBrowserPath(src)) {
							const publicDir = config.publicDir.pathname.replace(/\/$/, '').split('/').pop() + '/';
							throw new Error(
								`\n\n<script src="${src}"> references an asset in the "${publicDir}" directory. Please add the "is:inline" directive to keep this asset from being bundled.\n\nFile: ${filename}`
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

			const filename = normalizeFilename(parsedId.filename, config);
			const compileProps: CompileProps = {
				astroConfig: config,
				viteConfig: resolvedConfig,
				filename,
				id,
				source,
			};

			const transformResult = await cachedFullCompilation({
				compileProps,
				rawId: id,
				logging,
			});

			for (const dep of transformResult.cssDeps) {
				this.addWatchFile(dep);
			}

			const astroMetadata: AstroPluginMetadata['astro'] = {
				clientOnlyComponents: transformResult.clientOnlyComponents,
				hydratedComponents: transformResult.hydratedComponents,
				scripts: transformResult.scripts,
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
				id: context.modules[0]?.id ?? undefined,
				source: await context.read(),
			};
			const compile = () => cachedCompilation(compileProps);
			return handleHotUpdate(context, {
				config,
				logging,
				compile,
			});
		},
	};
}

function appendSourceMap(content: string, map?: string) {
	if (!map) return content;
	return `${content}\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
		map
	).toString('base64')}`;
}
