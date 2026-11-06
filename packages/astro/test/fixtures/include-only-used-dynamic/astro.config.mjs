import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		dynamicComponents: true,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
