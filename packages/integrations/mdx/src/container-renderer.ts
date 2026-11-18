import type { AstroRenderer } from 'astro';

export function getContainerRenderer(): AstroRenderer {
	return {
		name: 'astro:jsx',
		serverEntrypoint: '@astrojs/mdx/server.js',
	};
}
