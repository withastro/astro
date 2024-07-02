import { getCollection, getDataEntryById } from 'astro:content';

export async function GET() {
	const customLoader = (await getCollection('blog')).slice(0, 10);
	const fileLoader = await getCollection('dogs');

	const dataEntryById = await getDataEntryById('dogs', 'beagle');

	const simpleLoader = await getCollection('cats');

	return new Response(
		JSON.stringify({ customLoader, fileLoader, dataEntryById, simpleLoader }),
	);
}
