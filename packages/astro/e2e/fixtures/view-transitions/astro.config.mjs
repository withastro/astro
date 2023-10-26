import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';
import nodejs from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	output: 'hybrid',
	adapter: nodejs({ mode: 'standalone' }),
	integrations: [react(),vue(),svelte()],
	redirects: {
		'/redirect-two': '/two',
		'/redirect-external': 'http://example.com/',
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
