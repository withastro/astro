import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the lit renderer to support LitHTML components and templates.
	renderers: ['@astrojs/renderer-lit'],
});
