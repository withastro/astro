import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the Svelte renderer to support Svelte components.
	renderers: ['@astrojs/renderer-svelte'],
});
