import preact from '@astrojs/preact';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
// TODO: Re-enable once Svelte is compatible with Vite v8
// import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable many frameworks to support all different kinds of components.
	integrations: [
		react({ include: ['**/react/*'] }),
		preact({ include: ['**/preact/*'] }),
		solid({ include: ['**/solid/*'] }),
		// svelte(),
		vue(),
	],
	vite: {
		optimizeDeps: {
			// Pre-include framework deps to avoid re-optimization mid-page-load in CI,
			// which causes full page reloads that break hydration-dependent tests.
			include: [
				'preact', 'preact/hooks', 'preact/jsx-runtime',
				'react', 'react-dom', 'react/jsx-runtime',
			],
		},
	},
});
