import type { AstroRenderer } from 'astro';

export function getRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
	};
}

export const getContainerRenderer = (): AstroRenderer => getRenderer(false);
