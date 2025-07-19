// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	experimental: {
		experimentalRs: true,
	},
	markdown: {
		rsOptions: {
			fallbackToJs: true,
			cacheDir: './node_modules/.astro/mdx-rs',
			parallelism: 4,
		},
		// Standard markdown options that work with both JS and Rust processors
		gfm: true,
		smartypants: true,
	},
});