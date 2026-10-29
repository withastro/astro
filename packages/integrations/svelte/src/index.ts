import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer } from 'astro';
import { getContainerRenderer as getContainerRendererImpl } from './container-renderer.js';
import svelteRenderer from './renderer.js';

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/svelte/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/svelte] Importing `getContainerRenderer` from `@astrojs/svelte` is deprecated. Import it from `@astrojs/svelte/container-renderer` instead.',
	);
	return getContainerRendererImpl();
}

/**
 * The Svelte integration: `@sveltejs/vite-plugin-svelte` plus the renderer from
 * `@astrojs/svelte/renderer`.
 */
export default function svelteIntegration(options?: Options): AstroIntegration {
	return {
		name: '@astrojs/svelte',
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer }) => {
				addRenderer(svelteRenderer());
				updateConfig({
					vite: {
						plugins: [svelte(options)],
					},
				});
			},
		},
	};
}

export { vitePreprocess };
