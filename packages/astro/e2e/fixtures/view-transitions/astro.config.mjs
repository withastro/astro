import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
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
