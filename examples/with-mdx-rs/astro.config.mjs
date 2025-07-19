// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	experimental: {
		markdownRS: true,
	},
	markdown: {
		markdownRSOptions: {
			fallbackToJs: false, // Test without fallback
			cacheDir: './custom-cache-dir',
			parallelism: 8,
		},
		// Standard markdown options that work with both JS and Rust processors
		gfm: true,
		smartypants: true,
	},
});
