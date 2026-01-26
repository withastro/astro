import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { Plugin } from 'vite';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: '@astrojs/svelte/client.js',
		serverEntrypoint: '@astrojs/svelte/server.js',
	};
}

export { getRenderer as getContainerRenderer };

export default function svelteIntegration(options?: Options): AstroIntegration {
	return {
		name: '@astrojs/svelte',
		hooks: {
			'astro:config:setup': async ({ updateConfig, addRenderer }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: {
						plugins: [svelte(options), configEnvironmentPlugin()],
					},
				});
			},
		},
	};
}

function configEnvironmentPlugin(): Plugin {
	return {
		name: '@astrojs/svelte:config-environment',
		configEnvironment(environmentName) {
			return {
				optimizeDeps: {
					exclude: ['@astrojs/svelte/server.js'],
					includes: environmentName === 'client' ? ['@astrojs/svelte/client.js'] : [],
				},
			};
		},
	};
}

export { vitePreprocess };
