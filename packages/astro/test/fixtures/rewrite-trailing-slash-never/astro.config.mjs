import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	trailingSlash: "never",
	experimental: {
		rewriting: true
	},
	base: "base",
	site: "https://example.com"
});
