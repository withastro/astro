import type { AstroIntegration } from 'astro';
import mdxPlugin from '@mdx-js/rollup';
import { parse as parseESM } from 'es-module-lexer';
import { getFileInfo } from './utils.js';

export default function mdx(): AstroIntegration {
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
									jsx: true,
									jsxImportSource: 'astro',
									// Note: disable `.md` support
									format: 'mdx',
									mdExtensions: [],
								}),
							},
							command === 'dev' && {
								name: '@astrojs/mdx',
								transform(code: string, id: string) {
									if (!id.endsWith('.mdx')) return;

									const [, moduleExports] = parseESM(code);
									if (!moduleExports.includes('url')) {
										const { fileUrl } = getFileInfo(id, config);
										code += `export const url = ${JSON.stringify(fileUrl)};`;
									}
									// TODO: decline HMR updates until we have a stable approach
									return `${code}\nif (import.meta.hot) {
										import.meta.hot.decline();
									}`;
								},
							},
						],
					},
				});
			},
		},
	};
}
