import { getCollection, getDataEntryById } from 'astro:content';

export async function GET() {
	const customLoader = await getCollection('blog');
	const fileLoader = await getCollection('dogs');

	const dataEntryById = await getDataEntryById('dogs', 'beagle');

	return new Response(
		JSON.stringify({ customLoader, fileLoader, dataEntryById }),
	);
}
