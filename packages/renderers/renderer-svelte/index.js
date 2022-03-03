import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
	name: '@astrojs/renderer-svelte',
	client: './client.js',
	server: './server.js',
	viteConfig({ mode }) {
		return {
			optimizeDeps: {
				include: ['@astrojs/renderer-svelte/client.js', 'svelte', 'svelte/internal'],
				exclude: ['@astrojs/renderer-svelte/server.js'],
			},
			plugins: [
				svelte({
					emitCss: true,
					compilerOptions: { dev: mode === 'development', hydratable: true },
					experimental: {
						useVitePreprocess: true,
					}
				}),
			],
		};
	},
};
