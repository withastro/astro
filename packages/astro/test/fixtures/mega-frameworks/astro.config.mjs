import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [react(), svelte(), vue()],
	vite: {
		resolve: {
			alias: [{ find: /^component:(.*)$/, replacement: '/src/components/$1' }],
		},
		build: {
			assetsInlineLimit: 0,
		},
	},
});
