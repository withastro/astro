import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
	legacy: {
		astroFlavoredMarkdown: true,
	},
  integrations: [preact(), svelte()],
  site: 'https://astro.build/',
});
