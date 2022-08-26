import { compile as mdxCompile, nodeTypes } from '@mdx-js/mdx';
import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroConfig, AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { VFile } from 'vfile';
import type { Plugin as VitePlugin } from 'vite';
import { rehypeApplyFrontmatterExport, remarkInitializeAstroData } from './astro-data-utils.js';
import rehypeCollectHeadings from './rehype-collect-headings.js';
import remarkPrism from './remark-prism.js';
import remarkShiki from './remark-shiki.js';
import { getFileInfo, parseFrontmatter } from './utils.js';

type MdxOptions = {
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
	/**
	 * Choose which remark and rehype plugins to inherit, if any.
	 *
	 * - "markdown" (default) - inherit your project’s markdown plugin config ([see Markdown docs](https://docs.astro.build/en/guides/markdown-content/#configuring-markdown))
	 * - "defaults" - inherit Astro’s default plugins only ([see defaults](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins))
	 * - false - do not inherit any plugins
	 */
	extendPlugins?: 'markdown' | 'defaults' | false;
};

const DEFAULT_REMARK_PLUGINS: PluggableList = [remarkGfm, remarkSmartypants];
const DEFAULT_REHYPE_PLUGINS: PluggableList = [];

const RAW_CONTENT_ERROR =
	'MDX does not support rawContent()! If you need to read the Markdown contents to calculate values (ex. reading time), we suggest injecting frontmatter via remark plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

const COMPILED_CONTENT_ERROR =
	'MDX does not support compiledContent()! If you need to read the HTML contents to calculate values (ex. reading time), we suggest injecting frontmatter via rehype plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

async function getRemarkPlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): Promise<MdxRollupPluginOptions['remarkPlugins']> {
	let remarkPlugins: PluggableList = [
		// Set "vfile.data.astro" for plugins to inject frontmatter
		remarkInitializeAstroData,
	];
	switch (mdxOptions.extendPlugins) {
		case false:
			break;
		case 'defaults':
			remarkPlugins = [...remarkPlugins, ...DEFAULT_REMARK_PLUGINS];
			break;
		default:
			remarkPlugins = [
				...remarkPlugins,
				...(config.markdown.extendDefaultPlugins ? DEFAULT_REMARK_PLUGINS : []),
				...(config.markdown.remarkPlugins ?? []),
			];
			break;
	}
	if (config.markdown.syntaxHighlight === 'shiki') {
		remarkPlugins.push([await remarkShiki(config.markdown.shikiConfig)]);
	}
	if (config.markdown.syntaxHighlight === 'prism') {
		remarkPlugins.push(remarkPrism);
	}

	remarkPlugins = [...remarkPlugins, ...(mdxOptions.remarkPlugins ?? [])];
	return remarkPlugins;
}

function getRehypePlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): MdxRollupPluginOptions['rehypePlugins'] {
	let rehypePlugins: PluggableList = [
		// getHeadings() is guaranteed by TS, so we can't allow user to override
		rehypeCollectHeadings,
		// rehypeRaw allows custom syntax highlighters to work without added config
		[rehypeRaw, { passThrough: nodeTypes }] as any,
	];
	switch (mdxOptions.extendPlugins) {
		case false:
			break;
		case 'defaults':
			rehypePlugins = [...rehypePlugins, ...DEFAULT_REHYPE_PLUGINS];
			break;
		default:
			rehypePlugins = [
				...rehypePlugins,
				...(config.markdown.extendDefaultPlugins ? DEFAULT_REHYPE_PLUGINS : []),
				...(config.markdown.rehypePlugins ?? []),
			];
			break;
	}

	rehypePlugins = [...rehypePlugins, ...(mdxOptions.rehypePlugins ?? [])];
	return rehypePlugins;
}

export default function mdx(mdxOptions: MdxOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');

				const mdxPluginOpts: MdxRollupPluginOptions = {
					remarkPlugins: await getRemarkPlugins(mdxOptions, config),
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

									// Ensures styles and scripts are injected into a `<head>`
									// When a layout is not applied
									code += `\nMDXContent[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);`;

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
