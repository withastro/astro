import { getCollection, getEntry } from 'astro:content';

export async function GET() {
	const customLoader = (await getCollection('blog')).slice(0, 10);
	const fileLoader = await getCollection('dogs');

	const dataEntry = await getEntry('dogs', 'beagle');

	const simpleLoader = await getCollection('cats');

	const entryWithReference = await getEntry('spacecraft', 'columbia-copy')
	const referencedEntry = await getEntry(entryWithReference.data.cat)

	const increment = await getEntry('increment', 'value')

	return Response.json({ customLoader, fileLoader, dataEntry, simpleLoader, entryWithReference, referencedEntry, increment });
}
