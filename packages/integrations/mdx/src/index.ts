import { compile as mdxCompile, nodeTypes } from '@mdx-js/mdx';
import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroConfig, AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkShikiTwoslash from 'remark-shiki-twoslash';
import remarkSmartypants from 'remark-smartypants';
import { VFile } from 'vfile';
import type { Plugin as VitePlugin } from 'vite';
import { rehypeApplyFrontmatterExport, remarkInitializeAstroData } from './astro-data-utils.js';
import rehypeCollectHeadings from './rehype-collect-headings.js';
import remarkPrism from './remark-prism.js';
import { getFileInfo, parseFrontmatter } from './utils.js';

type WithExtends<T> = T | { extends: T };

type MdxOptions = {
	remarkPlugins?: WithExtends<MdxRollupPluginOptions['remarkPlugins']>;
	rehypePlugins?: WithExtends<MdxRollupPluginOptions['rehypePlugins']>;
};

const DEFAULT_REMARK_PLUGINS: MdxRollupPluginOptions['remarkPlugins'] = [
	remarkGfm,
	remarkSmartypants,
];
const DEFAULT_REHYPE_PLUGINS: MdxRollupPluginOptions['rehypePlugins'] = [];

const RAW_CONTENT_ERROR =
	'MDX does not support rawContent()! If you need to read the Markdown contents to calculate values (ex. reading time), we suggest injecting frontmatter via remark plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

const COMPILED_CONTENT_ERROR =
	'MDX does not support compiledContent()! If you need to read the HTML contents to calculate values (ex. reading time), we suggest injecting frontmatter via rehype plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

function handleExtends<T>(config: WithExtends<T[] | undefined>, defaults: T[] = []): T[] {
	if (Array.isArray(config)) return config;

	return [...defaults, ...(config?.extends ?? [])];
}

function getRemarkPlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): MdxRollupPluginOptions['remarkPlugins'] {
	let remarkPlugins = [
		// Initialize vfile.data.astroExports before all plugins are run
		remarkInitializeAstroData,
		...handleExtends(mdxOptions.remarkPlugins, DEFAULT_REMARK_PLUGINS),
	];
	if (config.markdown.syntaxHighlight === 'shiki') {
		// Default export still requires ".default" chaining for some reason
		// Workarounds tried:
		// - "import * as remarkShikiTwoslash"
		// - "import { default as remarkShikiTwoslash }"
		const shikiTwoslash = (remarkShikiTwoslash as any).default ?? remarkShikiTwoslash;
		remarkPlugins.push([shikiTwoslash, config.markdown.shikiConfig]);
	}
	if (config.markdown.syntaxHighlight === 'prism') {
		remarkPlugins.push(remarkPrism);
	}
	return remarkPlugins;
}

function getRehypePlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): MdxRollupPluginOptions['rehypePlugins'] {
	let rehypePlugins = handleExtends(mdxOptions.rehypePlugins, DEFAULT_REHYPE_PLUGINS);

	if (config.markdown.syntaxHighlight === 'shiki' || config.markdown.syntaxHighlight === 'prism') {
		rehypePlugins.unshift([rehypeRaw, { passThrough: nodeTypes }]);
	}
	// getHeadings() is guaranteed by TS, so we can't allow user to override
	rehypePlugins.unshift(rehypeCollectHeadings);

	return rehypePlugins;
}

export default function mdx(mdxOptions: MdxOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');

				const mdxPluginOpts: MdxRollupPluginOptions = {
					remarkPlugins: getRemarkPlugins(mdxOptions, config),
					rehypePlugins: getRehypePlugins(mdxOptions, config),
					jsx: true,
					jsxImportSource: 'astro',
					// Note: disable `.md` support
					format: 'mdx',
					mdExtensions: [],
				};

				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...mdxPlugin(mdxPluginOpts),
								// Override transform to alter code before MDX compilation
								// ex. inject layouts
								async transform(code, id) {
									if (!id.endsWith('mdx')) return;

									const { data: frontmatter, content: pageContent } = parseFrontmatter(code, id);
									const compiled = await mdxCompile(new VFile({ value: pageContent, path: id }), {
										...mdxPluginOpts,
										rehypePlugins: [
											...(mdxPluginOpts.rehypePlugins ?? []),
											() => rehypeApplyFrontmatterExport(frontmatter),
										],
									});

									return {
										code: String(compiled.value),
										map: compiled.map,
									};
								},
							},
							{
								name: '@astrojs/mdx-postprocess',
								// These transforms must happen *after* JSX runtime transformations
								transform(code, id) {
									if (!id.endsWith('.mdx')) return;
									const [, moduleExports] = parseESM(code);

									const { fileUrl, fileId } = getFileInfo(id, config);
									if (!moduleExports.includes('url')) {
										code += `\nexport const url = ${JSON.stringify(fileUrl)};`;
									}
									if (!moduleExports.includes('file')) {
										code += `\nexport const file = ${JSON.stringify(fileId)};`;
									}
									if (!moduleExports.includes('rawContent')) {
										code += `\nexport function rawContent() { throw new Error(${JSON.stringify(
											RAW_CONTENT_ERROR
										)}) };`;
									}
									if (!moduleExports.includes('compiledContent')) {
										code += `\nexport function compiledContent() { throw new Error(${JSON.stringify(
											COMPILED_CONTENT_ERROR
										)}) };`;
									}
									if (!moduleExports.includes('Content')) {
										code += `\nexport const Content = MDXContent;`;
									}

									if (command === 'dev') {
										// TODO: decline HMR updates until we have a stable approach
										code += `\nif (import.meta.hot) {
											import.meta.hot.decline();
										}`;
									}
									return code;
								},
							},
						] as VitePlugin[],
					},
				});
			},
		},
	};
}
