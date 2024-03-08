import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		directRenderScript: true,
	},
	vite: {
		build: {
			assetsInlineLimit: 100,
		},
	},
});
