import { getCollectionMetadata, render } from 'astro:content';

export async function GET() {
	const [entry] = await getCollectionMetadata('posts');
	try {
		await render(entry);
		return Response.json({ error: null });
	} catch (error) {
		return Response.json({ error: { name: error.name, message: error.message } });
	}
}
