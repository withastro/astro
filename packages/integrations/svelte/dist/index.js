import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { crawlFrameworkPkgs } from 'vitefu';
import { createSvelteOptimizeEsbuildPlugins } from './optimize-esbuild-plugins.js';
function getRenderer() {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: '@astrojs/svelte/client.js',
		serverEntrypoint: '@astrojs/svelte/server.js',
	};
}
function svelteIntegration(options) {
	return {
		name: '@astrojs/svelte',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, addRenderer }) => {
				addRenderer(getRenderer());
				const sveltePackages = await crawlFrameworkPkgs({
					root: fileURLToPath(config.root),
					isBuild: false,
					isFrameworkPkgByJson(pkgJson) {
						return !!pkgJson.peerDependencies?.svelte;
					},
				});
				updateConfig({
					vite: {
						plugins: [svelte(options), configEnvironmentPlugin(sveltePackages.ssr.noExternal)],
					},
				});
			},
		},
	};
}
function configEnvironmentPlugin(svelteNoExternal) {
	return {
		name: '@astrojs/svelte:config-environment',
		configEnvironment(environmentName, options) {
			const isServer = environmentName !== 'client';
			if (isServer && svelteNoExternal.length > 0) {
				const result = {
					resolve: {
						noExternal: svelteNoExternal,
					},
				};
				if (
					(environmentName === 'ssr' || environmentName === 'prerender') &&
					options.optimizeDeps?.noDiscovery === false
				) {
					result.optimizeDeps = {
						include: ['svelte/server', 'svelte/internal/server'],
						exclude: ['@astrojs/svelte/server.js'],
						esbuildOptions: {
							plugins: createSvelteOptimizeEsbuildPlugins('server'),
						},
					};
				}
				return result;
			}
			if (
				environmentName === 'client' ||
				((environmentName === 'ssr' || environmentName === 'prerender') &&
					options.optimizeDeps?.noDiscovery === false)
			) {
				return {
					optimizeDeps: {
						include: isServer
							? ['svelte/server', 'svelte/internal/server']
							: ['@astrojs/svelte/client.js'],
						exclude: isServer ? ['@astrojs/svelte/server.js'] : [],
						...(isServer
							? {
									esbuildOptions: {
										plugins: createSvelteOptimizeEsbuildPlugins('server'),
									},
								}
							: {}),
					},
				};
			}
		},
	};
}
export { svelteIntegration as default, getRenderer as getContainerRenderer, vitePreprocess };
