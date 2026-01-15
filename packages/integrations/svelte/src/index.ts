import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { EnvironmentOptions, Plugin } from 'vite';

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
		configEnvironment(environmentName, options) {
			const finalOptions: EnvironmentOptions = {
				resolve: {
					dedupe: ['svelte'],
				},
				optimizeDeps: {
					include: [],
				},
			};
			if (
				environmentName === 'client' ||
				((environmentName === 'ssr' || environmentName === 'prerender') &&
					options.optimizeDeps?.noDiscovery === false)
			) {
				if (environmentName === 'client') {
					finalOptions.optimizeDeps?.include?.push(
						'@astrojs/svelte/client.js',
					)
				}
				if (environmentName === 'ssr' || environmentName === 'prerender') {
					finalOptions.optimizeDeps?.exclude?.push(
						'@astrojs/svelte/server.js',
					)
					finalOptions.optimizeDeps?.include?.push(
						"svelte/server"
					)
				}
			}
			
			return finalOptions;
		},
	};
}

export { vitePreprocess };
