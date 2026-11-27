// @ts-check

import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable React to support React JSX components.
	integrations: [react(), svelte()],
	vite: {
		build: {
			assetsInlineLimit: 1,
		},
	},
});
