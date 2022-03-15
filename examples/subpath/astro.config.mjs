import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Comment out "renderers: []" to enable Astro's default component support.
	buildOptions: {
		site: 'http://example.com/blog',
	},
	renderers: ['@astrojs/renderer-react'],
});
