import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	legacy: {
		astroFlavoredMarkdown: true,
	},
	integrations: [tailwind()],
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
