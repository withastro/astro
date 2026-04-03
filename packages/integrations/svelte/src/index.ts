import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer } from 'astro';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { crawlFrameworkPkgs } from 'vitefu';
import { createSvelteOptimizeEsbuildPlugins } from './optimize-esbuild-plugins.js';

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

function configEnvironmentPlugin(svelteNoExternal: string[]): Plugin {
	return {
		name: '@astrojs/svelte:config-environment',
		configEnvironment(environmentName, options) {
			const isServer = environmentName !== 'client';

			if (isServer && svelteNoExternal.length > 0) {
				// Add svelte framework packages to noExternal so they go through
				// Vite's transform pipeline (Node can't import .svelte files natively).
				const result: any = {
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

export { vitePreprocess };
