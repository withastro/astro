import type { PluginContext } from 'rollup';
import type * as vite from 'vite';
import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { PluginMetadata as AstroPluginMetadata } from './types';

import ancestor from 'common-ancestor-path';
import esbuild from 'esbuild';
import fs from 'fs';
import slash from 'slash';
import { fileURLToPath } from 'url';
import { isRelativePath, startsWithForwardSlash } from '../core/path.js';
import { resolvePages } from '../core/util.js';
import { PAGE_SCRIPT_ID, PAGE_SSR_SCRIPT_ID } from '../vite-plugin-scripts/index.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';
import { cachedCompilation, CompileProps } from './compile.js';
import { handleHotUpdate, trackCSSDependencies } from './hmr.js';
import { parseAstroRequest } from './query.js';
import { getViteTransform, TransformHook } from './styles.js';

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
		} else if (filename.startsWith('/') && !ancestor(filename, config.root.pathname)) {
			filename = new URL('.' + filename, config.root).pathname;
		}
		return filename;
	}
	function relativeToRoot(pathname: string) {
		const arg = startsWithForwardSlash(pathname) ? '.' + pathname : pathname;
		const url = new URL(arg, config.root);
		return slash(fileURLToPath(url)) + url.search;
	}

	let resolvedConfig: vite.ResolvedConfig;
	let viteTransform: TransformHook;
	let viteDevServer: vite.ViteDevServer | null = null;

	// Variables for determing if an id starts with /src...
	const srcRootWeb = config.srcDir.pathname.slice(config.root.pathname.length - 1);
	const isBrowserPath = (path: string) => path.startsWith(srcRootWeb);

	return {
		name: 'astro:build',
		enforce: 'pre', // run transforms before other plugins can
		configResolved(_resolvedConfig) {
			resolvedConfig = _resolvedConfig;
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
				const parsedFrom = parseAstroRequest(from);
				if (parsedFrom.query.astro && isRelativePath(id) && parsedFrom.query.type === 'script') {
					const filename = normalizeFilename(parsedFrom.filename);
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
		async load(this: PluginContext, id, opts) {
			const parsedId = parseAstroRequest(id);
			const query = parsedId.query;
			if (!id.endsWith('.astro') && !query.astro) {
				return null;
			}
			// if we still get a relative path here, vite couldn't resolve the import
			if (isRelativePath(parsedId.filename)) {
				return null;
			}

			const filename = normalizeFilename(parsedId.filename);
			const fileUrl = new URL(`file://${filename}`);
			let source = await fs.promises.readFile(fileUrl, 'utf-8');
			const isPage = fileUrl.pathname.startsWith(resolvePages(config).pathname);
			if (isPage && config._ctx.scripts.some((s) => s.stage === 'page')) {
				source += `\n<script src="${PAGE_SCRIPT_ID}" />`;
			}
			const compileProps: CompileProps = {
				config,
				filename,
				moduleId: id,
				source,
				ssr: Boolean(opts?.ssr),
				viteTransform,
				pluginContext: this
			};
			if (query.astro) {
				if (query.type === 'style') {
					if (typeof query.index === 'undefined') {
						throw new Error(`Requests for Astro CSS must include an index.`);
					}

					const transformResult = await cachedCompilation(compileProps);

					// Track any CSS dependencies so that HMR is triggered when they change.
					await trackCSSDependencies.call(this, {
						viteDevServer,
						id,
						filename,
						deps: transformResult.rawCSSDeps,
					});
					const csses = transformResult.css;
					const code = csses[query.index];

					return {
						code,
					};
				} else if (query.type === 'script') {
					if (typeof query.index === 'undefined') {
						throw new Error(`Requests for hoisted scripts must include an index`);
					}
					// HMR hoisted script only exists to make them appear in the module graph.
					if (opts?.ssr) {
						return {
							code: `/* client hoisted script, empty in SSR: ${id} */`,
						};
					}

					const transformResult = await cachedCompilation(compileProps);
					const scripts = transformResult.scripts;
					const hoistedScript = scripts[query.index];

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

					return {
						code:
							hoistedScript.type === 'inline'
								? hoistedScript.code!
								: `import "${hoistedScript.src!}";`,
					};
				}
			}

			try {
				const transformResult = await cachedCompilation(compileProps);
				const { fileId: file, fileUrl: url } = getFileInfo(id, config);

				// Compile all TypeScript to JavaScript.
				// Also, catches invalid JS/TS in the compiled output before returning.
				const { code, map } = await esbuild.transform(transformResult.code, {
					loader: 'ts',
					sourcemap: 'external',
					sourcefile: id,
					// Pass relevant Vite options, if needed:
					define: config.vite?.define,
				});

				let SUFFIX = '';
				SUFFIX += `\nconst $$file = ${JSON.stringify(file)};\nconst $$url = ${JSON.stringify(
					url
				)};export { $$file as file, $$url as url };\n`;
				// Add HMR handling in dev mode.
				if (!resolvedConfig.isProduction) {
					// HACK: extract dependencies from metadata until compiler static extraction handles them
					const metadata = transformResult.code.split('$$createMetadata(')[1].split('});\n')[0];
					const pattern = /specifier:\s*'([^']*)'/g;
					const deps = new Set();
					let match;
					while ((match = pattern.exec(metadata)?.[1])) {
						deps.add(match);
					}

					let i = 0;
					while (i < transformResult.scripts.length) {
						deps.add(`${id}?astro&type=script&index=${i}`);
						SUFFIX += `import "${id}?astro&type=script&index=${i}";`;
						i++;
					}

					SUFFIX += `\nif (import.meta.hot) {
						import.meta.hot.accept(mod => mod);
					}`;
				}
				// Add handling to inject scripts into each page JS bundle, if needed.
				if (isPage) {
					SUFFIX += `\nimport "${PAGE_SSR_SCRIPT_ID}";`;
				}

				const astroMetadata: AstroPluginMetadata['astro'] = {
					clientOnlyComponents: transformResult.clientOnlyComponents,
					hydratedComponents: transformResult.hydratedComponents,
					scripts: transformResult.scripts
				};

				return {
					code: `${code}${SUFFIX}`,
					map,
					meta: {
						astro: astroMetadata,
						vite: {
							// Setting this vite metadata to `ts` causes Vite to resolve .js
							// extensions to .ts files.
							lang: 'ts',
						},
					},
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
						await esbuild.transform(scannedFrontmatter[1], {
							loader: 'ts',
							sourcemap: false,
							sourcefile: id,
						});
					} catch (frontmatterErr: any) {
						// Improve the error by replacing the phrase "unexpected end of file"
						// with "unexpected end of frontmatter" in the esbuild error message.
						if (frontmatterErr && frontmatterErr.message) {
							frontmatterErr.message = frontmatterErr.message.replace(
								'end of file',
								'end of frontmatter'
							);
						}
						throw frontmatterErr;
					}
				}

				// improve compiler errors
				if (err.stack.includes('wasm-function')) {
					const search = new URLSearchParams({
						labels: 'compiler',
						title: '🐛 BUG: `@astrojs/compiler` panic',
						template: '---01-bug-report.yml',
						'bug-description': `\`@astrojs/compiler\` encountered an unrecoverable error when compiling the following file.

**${id.replace(fileURLToPath(config.root), '')}**
\`\`\`astro
${source}
\`\`\``,
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
			if (context.server.config.isProduction) return;
			return handleHotUpdate.call(this, context, config, logging);
		},
	};
}
