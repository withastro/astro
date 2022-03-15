import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	renderers: [
		// Enable the Preact renderer to support Preact JSX components.
		'@astrojs/renderer-preact',
		// Enable the React renderer, for the Algolia search component
		'@astrojs/renderer-react',
	],
});
