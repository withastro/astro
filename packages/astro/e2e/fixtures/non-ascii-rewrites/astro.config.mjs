import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	devToolbar: {
		enabled: false,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	}
});
