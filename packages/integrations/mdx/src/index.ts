import type { AstroIntegration } from 'astro';
import mdx from '@mdx-js/rollup';

export default function (): AstroIntegration {
	return {
			name: '@astrojs/mdx',
			hooks: {
				'astro:config:setup': ({ updateConfig, addPageExtensions }) => {
					const mdxPlugin = mdx({
						jsx: true,
						'jsxImportSource': 'astro'
					})

					addPageExtensions(['.mdx']);
					updateConfig({
						vite: {
							plugins: [
								{ 	
									enforce: 'pre',
									...mdxPlugin
								},
								{
									name: '@astrojs/mdx',
									transform(code, id) {
										if (!id.endsWith('.mdx')) return;
										return `${code}\nif (import.meta.hot) {
											import.meta.hot.decline();
										}`
									}
								}
							]
						}
					})
				}
			}
		}
}
