import type { AstroIntegration } from 'astro';
import type { InlineConfig } from 'vite';

export default function markdoc(partialOptions: {} = {}): AstroIntegration {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdoc');
				console.log('Markdoc working!');

				const viteConfig: InlineConfig = {
					plugins: [
						{
							name: '@astrojs/markdoc',
							async transform(code, id) {
								if (!id.endsWith('.mdoc')) return;
								return `export const body = ${JSON.stringify(code)}`;
							},
						},
					],
				};
				updateConfig({ vite: viteConfig });
			},
		},
	};
}
