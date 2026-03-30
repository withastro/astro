import { createShikiHighlighter } from '@astrojs/markdown-remark';
import type { SSRError } from 'astro';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import type { MdastPluginDefinition, HastPluginDefinition, HighlightFn } from './tryckeri-plugins.js';
import { compileMdxWithPlugins } from './tryckeri-plugins.js';
import { safeParseFrontmatter } from './utils.js';

export interface VitePluginMdxOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
	mdastPlugins?: MdastPluginDefinition[];
	hastPlugins?: HastPluginDefinition[];
}

// NOTE: Do not destructure `opts` as we're assigning a reference that will be mutated later
export function vitePluginMdx(opts: VitePluginMdxOptions): Plugin {
	let highlightFn: HighlightFn | undefined;
	let initPromise: Promise<void> | undefined;
	let fileCount = 0;
	let totalTime = 0;

	return {
		name: '@mdx-js/rollup',
		enforce: 'pre',
		buildEnd() {
			if (fileCount > 0) {
				console.log(
					`[tryckeri] ${fileCount} MDX files compiled in ${totalTime.toFixed(0)}ms (${(totalTime / fileCount).toFixed(1)}ms avg)`,
				);
			}
			highlightFn = undefined;
			initPromise = undefined;
			fileCount = 0;
			totalTime = 0;
		},
		configResolved(resolved) {
			// HACK: Remove the `astro:jsx` plugin if defined as we handle the JSX transformation ourselves
			const jsxPluginIndex = resolved.plugins.findIndex((p) => p.name === 'astro:jsx');
			if (jsxPluginIndex !== -1) {
				// @ts-ignore-error ignore readonly annotation
				resolved.plugins.splice(jsxPluginIndex, 1);
			}

			// Eagerly start shiki init so it's ready before the first .mdx transform
			const syntaxHighlight = opts.mdxOptions?.syntaxHighlight;
			const syntaxHighlightType =
				typeof syntaxHighlight === 'string'
					? syntaxHighlight
					: syntaxHighlight
						? syntaxHighlight.type
						: undefined;

			if (syntaxHighlightType === 'shiki' && !highlightFn && !initPromise) {
				const shikiConfig = opts.mdxOptions?.shikiConfig ?? {};
				const tShikiInit = performance.now();
				initPromise = createShikiHighlighter({
					langs: shikiConfig.langs,
					theme: shikiConfig.theme,
					themes: shikiConfig.themes,
					langAlias: shikiConfig.langAlias,
				}).then((highlighter) => {
					console.log(`[tryckeri] shiki highlighter init: ${(performance.now() - tShikiInit).toFixed(0)}ms`);
					highlightFn = (code, lang, meta) =>
						highlighter.codeToHtmlSync(code, lang, {
							meta,
							wrap: shikiConfig.wrap,
							defaultColor: shikiConfig.defaultColor,
							transformers: shikiConfig.transformers,
						});
				});
			}
		},
		resolveId: {
			filter: {
				// Do not match sources that start with /
				id: /^[^/]/,
			},
			async handler(source, importer, options) {
				if (importer?.endsWith('.mdx')) {
					let resolved = await this.resolve(source, importer, options);
					if (!resolved) resolved = await this.resolve('./' + source, importer, options);
					return resolved;
				}
			},
		},
		transform: {
			filter: {
				id: /\.mdx$/,
			},
			async handler(code, id) {
				// Wait for shiki init if it's in progress
				if (initPromise) await initPromise;

				const t0 = performance.now();
				const { frontmatter, content } = safeParseFrontmatter(code, id);
				const tParse = performance.now();

				const syntaxHighlight = opts.mdxOptions?.syntaxHighlight;
				const excludeLangs =
					typeof syntaxHighlight === 'object' ? syntaxHighlight.excludeLangs : undefined;

				try {
					const tCompileStart = performance.now();
					const { code: rawCompiled, data, astroMetadata } = compileMdxWithPlugins(content, {
						filePath: id,
						frontmatter,
						highlight: highlightFn,
						excludeLangs,
						optimize: opts.mdxOptions?.optimize,
						mdastPlugins: opts.mdastPlugins,
						hastPlugins: opts.hastPlugins,
					});
					const tCompileEnd = performance.now();

					let compiled = rawCompiled;

					// Swap react jsx-runtime for astro jsx-runtime
					compiled = compiled.replace(
						/from\s+["']react\/jsx-runtime["']/g,
						`from "astro/jsx-runtime"`,
					);

					// Strip tryckeri's `export default MDXContent;`
					compiled = compiled.replace(/^export default MDXContent;\s*$/m, '');

					// Inject frontmatter and getHeadings exports
					compiled += `\nexport const frontmatter = ${JSON.stringify(frontmatter)};`;
					compiled += `\nexport function getHeadings() { return ${JSON.stringify(data.headings)}; }`;

					// Inject layout wrapper if frontmatter.layout is set
					if (frontmatter.layout) {
						compiled += `
import { jsx as __astro_layout_jsx__ } from 'astro/jsx-runtime';
import __astro_layout_component__ from ${JSON.stringify(frontmatter.layout)};`;
						// Rename MDXContent so the layout wrapper takes the default export
						compiled = compiled.replace(
							/^function MDXContent\(/m,
							'function __OriginalMDXContent__(',
						);
						// The postprocess plugin looks for `export default function MDXContent`
						compiled += `
export default function MDXContent(props) {
	const content = __OriginalMDXContent__(props);
	const { layout, ...frontmatterContent } = frontmatter;
	frontmatterContent.file = file;
	frontmatterContent.url = url;
	return __astro_layout_jsx__(__astro_layout_component__, {
		file,
		url,
		content: frontmatterContent,
		frontmatter: frontmatterContent,
		headings: getHeadings(),
		'server:root': true,
		children: content,
	});
}`;
					} else {
						// No layout: MDXContent is the default export
						compiled = compiled.replace(
							/^function MDXContent\(/m,
							'export default function MDXContent(',
						);
					}

					const tEnd = performance.now();
					const elapsed = tEnd - t0;
					const fileName = id.split('/').pop();
					if (elapsed > 2) {
						console.log(
							`[tryckeri] ${fileName} ${elapsed.toFixed(1)}ms (frontmatter: ${(tParse - t0).toFixed(1)}ms, compile: ${(tCompileEnd - tCompileStart).toFixed(1)}ms, postprocess: ${(tEnd - tCompileEnd).toFixed(1)}ms)`,
						);
					}
					fileCount++;
					totalTime += elapsed;

					return {
						code: compiled,
						map: null,
						meta: {
							astro: astroMetadata,
							vite: {
								lang: 'ts',
							},
						},
					};
				} catch (e: any) {
					const err: SSRError = e;
					err.name = 'MDXError';
					err.loc = { file: id, line: e.line, column: e.column };
					Error.captureStackTrace(err);
					throw err;
				}
			},
		},
	};
}
