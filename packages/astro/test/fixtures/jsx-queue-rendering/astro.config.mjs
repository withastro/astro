import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

// Base config - inline config will override experimental settings
export default defineConfig({
	integrations: [mdx()],
	experimental: {
		queuedRendering: {
			enabled: true,
		},
	},
});
