import type { AstroIntegration } from 'astro';

export interface SpaOptions {
	persistent?: boolean;
}

export default function createPlugin({ persistent = true }: SpaOptions): AstroIntegration {
	return {
		name: '@astrojs/spa',
		hooks: {
			'astro:config:setup': ({ injectScript }) => {
				// This gets injected into the user's page, so we need to re-export Turbolinks
				// from our own package so that package managers like pnpm don't get mad and
				// can follow the import correctly.
				injectScript('page', `import listen from "@astrojs/spa/client.js"; listen({ persistent: ${persistent} });`);
			},
		},
	};
}
