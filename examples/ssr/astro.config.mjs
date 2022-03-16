import { defineConfig } from 'astro/config';

export default defineConfig({
	renderers: ['@astrojs/renderer-svelte'],
	vite: {
		server: {
			cors: {
				credentials: true,
			},
			proxy: {
				'/api': {
					target: 'http://127.0.0.1:8085',
					changeOrigin: true,
				},
			},
		},
	},
});
