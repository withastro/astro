import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';

function docsLoader(base: string): Loader<{ library: 'docs'; version: number }> {
	const loader = glob({ pattern: '**/*.md', base });
	return {
		...loader,
		name: 'docs-loader',
		descriptors: { library: 'docs', version: 1 },
	};
}

const docs = defineCollection({ loader: docsLoader('./src/docs') });

const guides = defineCollection({
	loader: docsLoader('./src/docs'),
	descriptors: { version: 2, audience: ['beginners'] },
});

const authors = defineCollection({
	loader: () => [{ id: 'alice', name: 'Alice' }],
});

export const collections = { docs, guides, authors };
