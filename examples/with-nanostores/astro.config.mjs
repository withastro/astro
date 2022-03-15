import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable many renderers to support all different kinds of components.
	renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-react', '@astrojs/renderer-svelte', '@astrojs/renderer-vue', '@astrojs/renderer-solid'],
});
