import { defineConfig } from 'astro/config';

export default defineConfig({
	vite: {
		build: {
			rollupOptions: {
				external: ['/test.js'],
			},
		},
	},
});
