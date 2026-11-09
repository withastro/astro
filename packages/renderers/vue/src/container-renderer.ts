import type { AstroRenderer } from '@astrojs/runtime/types';

export function getContainerRenderer(): AstroRenderer {
	return {
		name: '@astrojs/vue',
		clientEntrypoint: '@astrojs/vue-renderer/client.js',
		serverEntrypoint: '@astrojs/vue-renderer/server.js',
	};
}
