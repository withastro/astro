import nodejs from '@astrojs/node';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'hybrid',
	adapter: nodejs({ mode: 'standalone' }),
	integrations: [react(),vue(),svelte()],
	redirects: {
		'/redirect-two': '/two',
		'/redirect-external': 'http://example.com/',
	},
	devToolbar: {
		enabled: false,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
