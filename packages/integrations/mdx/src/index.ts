import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { getFileInfo } from './utils.js';

type WithExtends<T> = T | { extends: T };

type MdxOptions = {
	remarkPlugins?: WithExtends<MdxRollupPluginOptions['remarkPlugins']>;
	rehypePlugins?: WithExtends<MdxRollupPluginOptions['rehypePlugins']>;
}

const DEFAULT_REMARK_PLUGINS = [remarkGfm, remarkSmartypants];

function handleExtends<T>(config: WithExtends<T[] | undefined>, defaults: T[] = []): T[] | undefined {
	if (Array.isArray(config)) return config;

	return [...defaults, ...(config?.extends ?? [])];
}

export default function mdx(mdxOptions: MdxOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');
				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...mdxPlugin({
									remarkPlugins: handleExtends(mdxOptions.remarkPlugins, DEFAULT_REMARK_PLUGINS),
									rehypePlugins: handleExtends(mdxOptions.rehypePlugins),
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
