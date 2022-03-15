import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the Preact renderer to support Preact JSX components.
	renderers: ['@astrojs/renderer-preact'],
});
