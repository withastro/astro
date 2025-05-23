import type { APIRoute } from 'astro';
import { getLiveCollection, getLiveEntry } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const addToAge = new URL(request.url).searchParams.get('addToAge');
	const filter = addToAge ? { addToAge: parseInt(addToAge) } : undefined;
	const collection = await getLiveCollection('liveStuff', filter);
	const entryByString = await getLiveEntry('liveStuff', '123');
	const entryByObject = await getLiveEntry('liveStuff', { id: '456', ...filter });

	return Response.json({
		collection,
		entryByObject,
		entryByString,
	});
};
