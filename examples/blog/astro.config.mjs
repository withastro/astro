import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	renderers: ['@astrojs/renderer-preact'],
	buildOptions: {
		site: 'https://example.com/',
	},
});
