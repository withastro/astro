import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://astro.build/",
	experimental: {
		experimentalRs: true,
	},
	markdown: {
		rsOptions: {
			fallbackToJs: true,
			cacheDir: './node_modules/.astro/mdx-rs',
			parallelism: 1,
		},
	},
});