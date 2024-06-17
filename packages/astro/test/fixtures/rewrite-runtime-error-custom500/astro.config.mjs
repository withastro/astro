import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	experimental: {
		rewriting: true
	},
	site: "https://example.com"
});
