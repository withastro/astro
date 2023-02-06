import type { AstroIntegration } from 'astro';

export default function markdoc(partialOptions: {} = {}): AstroIntegration {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdoc');
				console.log('Markdoc working!');
			},
		},
	};
}
