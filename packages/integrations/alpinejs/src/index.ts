import type { AstroIntegration } from 'astro';

export default function createPlugin(): AstroIntegration {
	return {
		name: '@astrojs/alpinejs',
		hooks: {
			'astro:config:setup': ({ injectScript }) => {
				// This gets injected into the user's page, so the import will pull
				// from the project's version of Alpine.js in their package.json.
				injectScript(
					'page',
					`import Alpine from 'alpinejs'; window.Alpine = Alpine; Alpine.start();`
				);
			},
		},
	};
}
