import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the React renderer to support React JSX components.
	renderers: ['@astrojs/renderer-react'],
});
