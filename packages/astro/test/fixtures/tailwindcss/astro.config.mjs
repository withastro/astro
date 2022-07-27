import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	legacy: {
		astroFlavoredMarkdown: true,
	},
	integrations: [tailwind(), mdx()],
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
