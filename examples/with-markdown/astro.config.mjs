import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-react', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
});
