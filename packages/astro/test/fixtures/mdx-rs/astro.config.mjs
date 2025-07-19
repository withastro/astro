import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://astro.build/",
	experimental: {
		markdownRS: true,
	},
	markdown: {
		markdownRSOptions: {
			fallbackToJs: true,
			cacheDir: './node_modules/.astro/mdx-rs',
			parallelism: 1,
		},
	},
});