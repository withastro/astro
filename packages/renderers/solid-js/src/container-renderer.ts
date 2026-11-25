import type { AstroRenderer } from '@astrojs/runtime/types';

export function getContainerRenderer(): AstroRenderer {
	return {
		name: '@astrojs/solid-js',
		clientEntrypoint: '@astrojs/solid-js-renderer/client.js',
		serverEntrypoint: '@astrojs/solid-js-renderer/server.js',
	};
}
