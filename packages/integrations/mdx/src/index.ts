import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypePrism from '@mapbox/rehype-prism';
import { getFileInfo } from './utils.js';

type WithExtends<T> = T | { extends: T };

type MdxOptions = {
	remarkPlugins?: WithExtends<MdxRollupPluginOptions['remarkPlugins']>;
	rehypePlugins?: WithExtends<MdxRollupPluginOptions['rehypePlugins']>;
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
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');
				let remarkPlugins = handleExtends(mdxOptions.remarkPlugins, DEFAULT_REMARK_PLUGINS);
				let rehypePlugins = handleExtends(mdxOptions.rehypePlugins);

				if (config.markdown.syntaxHighlight === 'shiki') {
					rehypePlugins.push(rehypePrettyCode);
				}

				if (config.markdown.syntaxHighlight === 'prism') {
					rehypePlugins.push(rehypePrism);
				}

				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...mdxPlugin({
									remarkPlugins,
									rehypePlugins,
									// place these after so the user can't override
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
