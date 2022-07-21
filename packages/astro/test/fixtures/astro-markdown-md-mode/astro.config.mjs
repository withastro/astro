import { defineConfig } from 'astro/config';
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
	markdown: {
		mode: 'md',
	},
  integrations: [svelte()],
  site: 'https://astro.build/',
});
