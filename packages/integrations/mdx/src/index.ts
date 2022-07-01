import mdxPlugin from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';

export default function mdx(): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': ({ updateConfig, addPageExtension, command }: any) => {
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
