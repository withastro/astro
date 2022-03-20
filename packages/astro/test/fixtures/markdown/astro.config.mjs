import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	buildOptions: {
		sitemap: false,
	},
	integrations: [preact()],
});