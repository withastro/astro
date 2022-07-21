import type { RemarkMdxFrontmatterOptions } from 'remark-mdx-frontmatter';
import type { AstroIntegration } from 'astro';
import remarkShikiTwoslash from 'remark-shiki-twoslash';
import { nodeTypes } from '@mdx-js/mdx';
import rehypeRaw from 'rehype-raw';
import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import { parse as parseESM } from 'es-module-lexer';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkSmartypants from 'remark-smartypants';
import remarkPrism from './remark-prism.js';
import { getFileInfo } from './utils.js';

type WithExtends<T> = T | { extends: T };

type MdxOptions = {
	remarkPlugins?: WithExtends<MdxRollupPluginOptions['remarkPlugins']>;
	rehypePlugins?: WithExtends<MdxRollupPluginOptions['rehypePlugins']>;
	/**
	 * Configure the remark-mdx-frontmatter plugin
	 * @see https://github.com/remcohaszing/remark-mdx-frontmatter#options for a full list of options
	 * @default {{ name: 'frontmatter' }}
	 */
	frontmatterOptions?: RemarkMdxFrontmatterOptions;
};

const DEFAULT_REMARK_PLUGINS = [remarkGfm, remarkSmartypants];

function handleExtends<T>(
	config: WithExtends<T[] | undefined>,
	defaults: T[] = [],
): T[] {
	if (Array.isArray(config)) return config;

	return [...defaults, ...(config?.extends ?? [])];
}

export default function mdx(mdxOptions: MdxOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');
				let remarkPlugins = handleExtends(mdxOptions.remarkPlugins, DEFAULT_REMARK_PLUGINS);
				let rehypePlugins = handleExtends(mdxOptions.rehypePlugins);

				if (config.markdown.syntaxHighlight === 'shiki') {
					remarkPlugins.push([
						// Default export still requires ".default" chaining for some reason
						// Workarounds tried:
						// - "import * as remarkShikiTwoslash"
						// - "import { default as remarkShikiTwoslash }"
						(remarkShikiTwoslash as any).default,
						config.markdown.shikiConfig,
					]);
					rehypePlugins.push([rehypeRaw, { passThrough: nodeTypes }]);
				}
				
				if (config.markdown.syntaxHighlight === 'prism') {
					remarkPlugins.push(remarkPrism);
					rehypePlugins.push([rehypeRaw, { passThrough: nodeTypes }]);
				}

				remarkPlugins.push(remarkFrontmatter);
				remarkPlugins.push([
					remarkMdxFrontmatter,
					{
						name: 'frontmatter',
						...mdxOptions.frontmatterOptions,
					},
				]);

				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...mdxPlugin({
									remarkPlugins,
									rehypePlugins,
									jsx: true,
									jsxImportSource: 'astro',
									// Note: disable `.md` support
									format: 'mdx',
									mdExtensions: [],
								}),
							},
							{
								name: '@astrojs/mdx',
								transform(code: string, id: string) {
									if (!id.endsWith('.mdx')) return;
									const [, moduleExports] = parseESM(code);

									if (!moduleExports.includes('url')) {
										const { fileUrl } = getFileInfo(id, config);
										code += `\nexport const url = ${JSON.stringify(fileUrl)};`;
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
						],
					},
				});
			},
		},
	};
}
