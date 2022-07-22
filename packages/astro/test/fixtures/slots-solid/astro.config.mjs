import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import solid from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
	legacy: {
		astroFlavoredMarkdown: true,
	},
	integrations: [solid(), mdx()],
});
