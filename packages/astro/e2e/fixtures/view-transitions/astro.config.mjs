import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import nodejs from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: nodejs({ mode: 'standalone' }),
	integrations: [react()],
	experimental: {
		viewTransitions: true,
		assets: true,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
