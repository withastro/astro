import type { APIRoute } from 'astro';
import { getCollection, getCollectionsMetadata } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
	const metadata = await getCollectionsMetadata();
	// Mutating the result must not change what other callers receive
	metadata[0].descriptors.mutated = true;
	const docs = (await getCollectionsMetadata())
		.filter((collection) => collection.type === 'build-time')
		.filter((collection) => collection.descriptors.library === 'docs');
	const entries = await Promise.all(
		docs.map(async ({ name }) => ({ name, ids: (await getCollection(name)).map((entry) => entry.id) })),
	);
	return Response.json({ metadata: await getCollectionsMetadata(), entries });
};
