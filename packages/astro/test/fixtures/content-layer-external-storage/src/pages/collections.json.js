import { getCollection, getCollectionMetadata, getEntry } from 'astro:content';

const byId = (a, b) => a.id.localeCompare(b.id);

export async function GET() {
	const posts = await getCollection('posts');
	const metadata = await getCollectionMetadata('posts');
	const author = await getEntry('authors', 'ema');
	const notes = await getCollection('notes');

	return Response.json({
		posts: posts
			.map(({ id, data, body }) => ({ id, title: data.title, author: data.author, body }))
			.sort(byId),
		metadata: metadata.map((entry) => ({ id: entry.id, fields: Object.keys(entry).sort() })).sort(byId),
		author: author?.data,
		notes: notes.map(({ id, data }) => ({ id, title: data.title })),
	});
}
