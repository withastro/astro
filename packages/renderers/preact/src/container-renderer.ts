import type { AstroRenderer } from '@astrojs/runtime/types';

export function getRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development
			? '@astrojs/preact-renderer/client-dev.js'
			: '@astrojs/preact-renderer/client.js',
		serverEntrypoint: '@astrojs/preact-renderer/server.js',
	};
}

export const getContainerRenderer = (): AstroRenderer => getRenderer(false);
