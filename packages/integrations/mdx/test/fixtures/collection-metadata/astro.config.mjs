import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import { remarkCollection } from './src/remark-collection.mjs';

export default defineConfig({
	integrations: [mdx()],
	markdown: {
		remarkPlugins: [remarkCollection],
	},
	experimental: {
		collectionMetadata: true,
	},
});
