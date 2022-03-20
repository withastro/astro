import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	integrations: [svelte()],
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
