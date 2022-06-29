import type { AstroIntegration } from 'astro';
import mdx from '@mdx-js/rollup';

export default function (): AstroIntegration {
	return {
			name: '@astrojs/mdx',
			hooks: {
				'astro:config:setup': ({ updateConfig, addPageExtension }) => {
					const mdxPlugin = mdx({
						jsx: true,
						jsxImportSource: 'astro'
					})

					addPageExtension('.mdx');
					updateConfig({
						vite: {
							plugins: [
								{ 	
									enforce: 'pre',
									...mdxPlugin
								},
								{
									name: '@astrojs/mdx',
									transform(code: string, id: string) {
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
