import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: 'https://mdx-is-neat.com/',
  integrations: [react(), mdx()],
  experimental: {
		assets: true
	}
});
