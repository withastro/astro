import { defineConfig } from 'astro/config';
import { remarkCollection } from './src/remark-collection.mjs';

export default defineConfig({
	integrations: [
		{
			name: 'read-collections',
			hooks: {
				'astro:build:done': async ({ collections }) => {
					globalThis.buildDoneCollections = collections.entries && {
						metadata: collections.metadata,
						docs: await collections.entries('docs', { content: false }),
						docsWithContent: await collections.entries('docs'),
						products: await collections.entries('products'),
					};
				},
			},
		},
	],
	markdown: {
		remarkPlugins: [remarkCollection],
	},
	experimental: {
		collectionMetadata: true,
	},
});
