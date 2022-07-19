import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import { getFileInfo } from './utils.js';

type MdxOptions = Pick<MdxRollupPluginOptions, 'remarkPlugins' | 'rehypePlugins'>;

export default function mdx(mdxOptions: MdxOptions): AstroIntegration {
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
									...mdxOptions,
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
