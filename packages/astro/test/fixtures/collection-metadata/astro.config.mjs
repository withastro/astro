import { defineConfig } from 'astro/config';
import { remarkCollection } from './src/remark-collection.mjs';

export default defineConfig({
	markdown: {
		remarkPlugins: [remarkCollection],
	},
	experimental: {
		collectionMetadata: true,
	},
});
