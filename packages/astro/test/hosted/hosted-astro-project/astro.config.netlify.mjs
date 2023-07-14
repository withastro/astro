import netlify from "@astrojs/netlify";
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: netlify(),
	outDir: "./dist_netlify",
	experimental: {
		assets: true
	}
});
