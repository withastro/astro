import type * as vite from 'vite';
import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from '../core/logger.js';

import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import slash from 'slash';
import { getViteTransform, TransformHook } from './styles.js';
import { parseAstroRequest } from './query.js';
import { cachedCompilation } from './compile.js';
import ancestor from 'common-ancestor-path';
import { trackCSSDependencies, handleHotUpdate } from './hmr.js';
import { isRelativePath, startsWithForwardSlash } from '../core/path.js';

const FRONTMATTER_PARSE_REGEXP = /^\-\-\-(.*)^\-\-\-/ms;
interface AstroPluginOptions {
	config: AstroConfig;
	logging: LogOptions;
}

/** Transform .astro files for Vite */
export default function astro({ config, logging }: AstroPluginOptions): vite.Plugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, config.projectRoot.pathname)) {
			filename = new URL('.' + filename, config.projectRoot).pathname;
		}
		return filename;
	}
	function relativeToRoot(pathname: string) {
		const arg = startsWithForwardSlash(pathname) ? '.' + pathname : pathname;
		const url = new URL(arg, config.projectRoot);
		return slash(fileURLToPath(url)) + url.search;
	}

	let viteTransform: TransformHook;
	let viteDevServer: vite.ViteDevServer | null = null;

	// Variables for determing if an id starts with /src...
	const srcRootWeb = config.src.pathname.slice(config.projectRoot.pathname.length - 1);
	const isBrowserPath = (path: string) => path.startsWith(srcRootWeb);

	return {
		name: 'astro:build',
		enforce: 'pre', // run transforms before other plugins can
		configResolved(resolvedConfig) {
			viteTransform = getViteTransform(resolvedConfig);
		},
		configureServer(server) {
			viteDevServer = server;
		},
		// note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.globEager, etc.)
		async resolveId(id, from) {
			// If resolving from an astro subresource such as a hoisted script,
			// we need to resolve relative paths ourselves.
			if (from) {
				const { query: fromQuery, filename } = parseAstroRequest(from);
				if (fromQuery.astro && isRelativePath(id) && fromQuery.type === 'script') {
					const resolvedURL = new URL(id, `file://${filename}`);
					const resolved = resolvedURL.pathname;
					if (isBrowserPath(resolved)) {
						return relativeToRoot(resolved + resolvedURL.search);
					}
					return slash(fileURLToPath(resolvedURL)) + resolvedURL.search;
				}
			}

			// serve sub-part requests (*?astro) as virtual modules
			const { query } = parseAstroRequest(id);
			if (query.astro) {
				// Convert /src/pages/index.astro?astro&type=style to /Users/name/
				// Because this needs to be the id for the Vite CSS plugin to property resolve
				// relative @imports.
				if (query.type === 'style' && isBrowserPath(id)) {
					return relativeToRoot(id);
				}

				return id;
			}
		},
		async load(id, opts) {
			let { filename, query } = parseAstroRequest(id);
			if (query.astro) {
				if (query.type === 'style') {
					if (filename.startsWith('/@fs')) {
						filename = filename.slice('/@fs'.length);
					} else if (filename.startsWith('/') && !ancestor(filename, config.projectRoot.pathname)) {
						filename = new URL('.' + filename, config.projectRoot).pathname;
					}

					if (typeof query.index === 'undefined') {
						throw new Error(`Requests for Astro CSS must include an index.`);
					}

					const transformResult = await cachedCompilation(config, normalizeFilename(filename), null, viteTransform, { ssr: Boolean(opts?.ssr) });

					// Track any CSS dependencies so that HMR is triggered when they change.
					await trackCSSDependencies.call(this, { viteDevServer, id, filename, deps: transformResult.rawCSSDeps });
					const csses = transformResult.css;
					const code = csses[query.index];

					return {
						code,
					};
				} else if (query.type === 'script') {
					if (typeof query.index === 'undefined') {
						throw new Error(`Requests for hoisted scripts must include an index`);
					}

					const transformResult = await cachedCompilation(config, normalizeFilename(filename), null, viteTransform, { ssr: Boolean(opts?.ssr) });
					const scripts = transformResult.scripts;
					const hoistedScript = scripts[query.index];

					if (!hoistedScript) {
						throw new Error(`No hoisted script at index ${query.index}`);
					}

					return {
						code: hoistedScript.type === 'inline' ? hoistedScript.code! : `import "${hoistedScript.src!}";`,
					};
				}
			}

			return null;
		},
		async transform(source, id, opts) {
			if (!id.endsWith('.astro')) {
				return;
			}

			try {
				const transformResult = await cachedCompilation(config, id, source, viteTransform, { ssr: Boolean(opts?.ssr) });

				// Compile all TypeScript to JavaScript.
				// Also, catches invalid JS/TS in the compiled output before returning.
				const { code, map } = await esbuild.transform(transformResult.code, {
					loader: 'ts',
					sourcemap: 'external',
					sourcefile: id,
				});

				return {
					code,
					map,
				};
			} catch (err: any) {
				// Verify frontmatter: a common reason that this plugin fails is that
				// the user provided invalid JS/TS in the component frontmatter.
				// If the frontmatter is invalid, the `err` object may be a compiler
				// panic or some other vague/confusing compiled error message.
				//
				// Before throwing, it is better to verify the frontmatter here, and
				// let esbuild throw a more specific exception if the code is invalid.
				// If frontmatter is valid or cannot be parsed, then continue.
				const scannedFrontmatter = FRONTMATTER_PARSE_REGEXP.exec(source);
				if (scannedFrontmatter) {
					try {
						await esbuild.transform(scannedFrontmatter[1], { loader: 'ts', sourcemap: false, sourcefile: id });
					} catch (frontmatterErr: any) {
						// Improve the error by replacing the phrase "unexpected end of file"
						// with "unexpected end of frontmatter" in the esbuild error message.
						if (frontmatterErr && frontmatterErr.message) {
							frontmatterErr.message = frontmatterErr.message.replace('end of file', 'end of frontmatter');
						}
						throw frontmatterErr;
					}
				}

				// improve compiler errors
				if (err.stack.includes('wasm-function')) {
					const search = new URLSearchParams({
						labels: 'compiler',
						title: '🐛 BUG: `@astrojs/compiler` panic',
						body: `### Describe the Bug
    
    \`@astrojs/compiler\` encountered an unrecoverable error when compiling the following file.
    
    **${id.replace(fileURLToPath(config.projectRoot), '')}**
    \`\`\`astro
    ${source}
    \`\`\`
    `,
					});
					err.url = `https://github.com/withastro/astro/issues/new?${search.toString()}`;
					err.message = `Error: Uh oh, the Astro compiler encountered an unrecoverable error!
    
    Please open
    a GitHub issue using the link below:
    ${err.url}`;

					if (logging.level !== 'debug') {
						// TODO: remove stack replacement when compiler throws better errors
						err.stack = `    at ${id}`;
					}
				}

				throw err;
			}
		},
		async handleHotUpdate(context) {
			return handleHotUpdate(context, config);
		},
	};
}
