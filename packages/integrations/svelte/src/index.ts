import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer, ContainerRenderer } from 'astro';
import type { Plugin } from 'vite';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: '@astrojs/svelte/client.js',
		serverEntrypoint: '@astrojs/svelte/server.js',
	};
}

export function getContainerRenderer(): ContainerRenderer {
	return {
		name: '@astrojs/svelte',
		serverEntrypoint: '@astrojs/svelte/server.js',
	};
}

const VIRTUAL_MODULE_ID = 'astro:svelte:opts';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

function optionsPlugin(options: Pick<Options, 'configFile'> & { root: URL }): Plugin {
	let configFile = (options.configFile ?? 'svelte.config.js') || null;
	if (configFile && !configFile.startsWith('.')) {
		configFile = `./${configFile}`;
	}
	let resolvedPath = configFile ? new URL(configFile, options.root) : null;

	return {
		name: '@astrojs/svelte:opts',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		async load(id) {
			if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
				return;
			}

			// We check if the config file actually exists
			const resolved = resolvedPath ? await this.resolve(resolvedPath.href) : null;

			if (resolved) {
				return `
					import svelteConfig from ${JSON.stringify(resolvedPath!.href)};

					export const experimentalAsync = svelteConfig?.compilerOptions?.experimental?.async ?? false;
				`;
			}

			return `export const experimentalAsync = false;`;
		},
	};
}

export default function svelteIntegration(options?: Options): AstroIntegration {
	return {
		name: '@astrojs/svelte',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, addRenderer }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: {
						optimizeDeps: {
							include: ['@astrojs/svelte/client.js'],
							exclude: ['@astrojs/svelte/server.js'],
						},
						plugins: [
							svelte(options),
							optionsPlugin({
								configFile: options?.configFile,
								root: config.root,
							}),
						],
					},
				});
			},
		},
	};
}

export { vitePreprocess };
