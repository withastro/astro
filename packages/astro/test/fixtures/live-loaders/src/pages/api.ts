import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const addToAge = new URL(request.url).searchParams.get('addToAge');
	const filter = addToAge ? { addToAge: parseInt(addToAge) } : undefined;
	const collection = await getCollection('liveStuff', filter);
	const entryByString = await getEntry('liveStuff', '123');
	const entryByObject = await getEntry(
		'liveStuff',
		{ id: '456', ...filter },
	);
	return Response.json({ collection, entryByObject, entryByString });
};
