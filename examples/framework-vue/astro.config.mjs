import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the Vue renderer to support Vue components.
	renderers: ['@astrojs/renderer-vue'],
});
