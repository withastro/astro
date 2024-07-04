import { getCollection, getEntry } from 'astro:content';

export async function GET() {
	const customLoader = (await getCollection('blog')).slice(0, 10);
	const fileLoader = await getCollection('dogs');

	const dataEntry= await getEntry('dogs', 'beagle');

	const simpleLoader = await getCollection('cats');

	return new Response(
		JSON.stringify({ customLoader, fileLoader, dataEntry, simpleLoader }),
	);
}
