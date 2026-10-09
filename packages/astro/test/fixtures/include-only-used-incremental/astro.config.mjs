import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		treeShakeComponents: true,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
