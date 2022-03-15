import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the Solid renderer to support Solid JSX components.
	renderers: ['@astrojs/renderer-solid'],
});
