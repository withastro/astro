import { readFileSync } from 'node:fs';
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

/**
 * Creates esbuild optimizer plugins that compile `.svelte` and `.svelte.js/.ts` files
 * during dependency pre-bundling for non-client environments.
 *
 * `@sveltejs/vite-plugin-svelte` only registers its optimizer esbuild plugins at the
 * top-level `optimizeDeps` config, which Vite only propagates to the `client` environment.
 * Non-client environments (e.g. Cloudflare SSR) that run their own dependency optimizer
 * don't receive these plugins, causing `.svelte.js` files with Svelte 5 runes to be
 * bundled without compilation.
 */
function createSvelteOptimizeEsbuildPlugins(generate: 'server' | 'client') {
	// Lazy-load svelte/compiler to avoid loading it when not needed
	let svelteCompiler: typeof import('svelte/compiler') | undefined;
	async function loadCompiler() {
		if (!svelteCompiler) {
			svelteCompiler = await import('svelte/compiler');
		}
		return svelteCompiler;
	}

	const svelteComponentPlugin = {
		name: 'astrojs-svelte:optimize-component',
		setup(build: any) {
			// Skip during dependency scanning phase
			if (build.initialOptions.plugins?.some((v: any) => v.name === 'vite:dep-scan')) return;

			build.onLoad(
				{ filter: /\.svelte(?:\?.*)?$/ },
				async ({ path: filename }: { path: string }) => {
					const code = readFileSync(filename, 'utf8');
					try {
						const compiler = await loadCompiler();
						const compiled = compiler.compile(code, {
							dev: true,
							filename,
							generate,
							// During prebundling, CSS must be injected because we can't externalize styles
							css: 'injected',
						});
						const result = compiled.js;
						const contents = result.map
							? result.code + '//# sourceMappingURL=' + result.map.toUrl()
							: result.code;
						return { contents };
					} catch (e: any) {
						return {
							errors: [
								{
									text: e.message,
									location: e.position
										? { file: filename, line: e.position.line, column: e.position.column }
										: undefined,
								},
							],
						};
					}
				},
			);
		},
	};

	const svelteModulePlugin = {
		name: 'astrojs-svelte:optimize-module',
		setup(build: any) {
			// Skip during dependency scanning phase
			if (build.initialOptions.plugins?.some((v: any) => v.name === 'vite:dep-scan')) return;

			build.onLoad(
				{ filter: /\.svelte\.[jt]s(?:\?.*)?$/ },
				async ({ path: filename }: { path: string }) => {
					const code = readFileSync(filename, 'utf8');
					try {
						const compiler = await loadCompiler();
						const compiled = compiler.compileModule(code, {
							dev: true,
							filename,
							generate,
						});
						const result = compiled.js;
						const contents = result.map
							? result.code + '//# sourceMappingURL=' + result.map.toUrl()
							: result.code;
						return { contents };
					} catch (e: any) {
						return {
							errors: [
								{
									text: e.message,
									location: e.position
										? { file: filename, line: e.position.line, column: e.position.column }
										: undefined,
								},
							],
						};
					}
				},
			);
		},
	};

	return [svelteComponentPlugin, svelteModulePlugin];
}

function configEnvironmentPlugin(): Plugin {
	return {
		name: '@astrojs/svelte:config-environment',
		configEnvironment(environmentName, options) {
			if (
				environmentName === 'client' ||
				((environmentName === 'ssr' || environmentName === 'prerender') &&
					options.optimizeDeps?.noDiscovery === false)
			) {
				const isServer = environmentName !== 'client';
				return {
					optimizeDeps: {
						include: isServer
							? ['svelte/server', 'svelte/internal/server']
							: ['@astrojs/svelte/client.js'],
						exclude: isServer ? ['@astrojs/svelte/server.js'] : [],
						// For non-client environments, add esbuild optimizer plugins to compile
						// .svelte and .svelte.js files during dependency pre-bundling.
						// The upstream @sveltejs/vite-plugin-svelte only registers these at the
						// top-level config, which Vite only propagates to the client environment.
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
