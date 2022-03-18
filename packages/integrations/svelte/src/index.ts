import type { AstroIntegration, AstroRenderer } from 'astro';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: '@astrojs/svelte/client.js',
		serverEntrypoint: '@astrojs/svelte/server.js',
	};
}

function getViteConfiguration(isDev: boolean) {
	return {
		optimizeDeps: {
			include: ['@astrojs/svelte/client.js', 'svelte', 'svelte/internal'],
			exclude: ['@astrojs/svelte/server.js'],
		},
		plugins: [
			svelte({
				emitCss: true,
				compilerOptions: { dev: isDev, hydratable: true },
				preprocess: [
					preprocess({
						less: true,
						sass: { renderSync: true },
						scss: { renderSync: true },
						stylus: true,
						typescript: true,
					}),
				],
			}),
		],
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/svelte',
		hooks: {
			// Anything that gets returned here is merged into Astro Config
			'astro:config:setup': ({ command, updateConfig, addRenderer }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration(command === 'dev') });
			},
		},
	};
}
