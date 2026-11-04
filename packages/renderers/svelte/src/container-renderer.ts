import type { AstroRenderer } from '@astrojs/runtime/types';

export function getContainerRenderer(): AstroRenderer {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: '@astrojs/svelte-renderer/client.js',
		serverEntrypoint: '@astrojs/svelte-renderer/server.js',
	};
}
