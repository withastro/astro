import { defineConfig } from 'astro/config';
import { remarkCollection } from './src/remark-collection.mjs';

export default defineConfig({
	integrations: [
		{
			name: 'read-collections',
			hooks: {
				'astro:build:done': async ({ collections }) => {
					if (!collections.entries) {
						globalThis.buildDoneCollections = undefined;
						return;
					}
					const docs = await collections.entries('docs', { content: false });
					docs[0].data.title = 'Changed by an integration';
					globalThis.buildDoneCollections = {
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
