import type { APIRoute } from 'astro';
import { getLiveCollection, getLiveEntry } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const addToAge = url.searchParams.get('addToAge');
	const returnInvalid = url.searchParams.has('returnInvalid');
	const filter = addToAge ? { addToAge: parseInt(addToAge), returnInvalid } : undefined;
	const { error, entries, cacheHint } = await getLiveCollection('liveStuff', filter);
	const entryByString = await getLiveEntry('liveStuff', '123');
	const entryByObject = await getLiveEntry('liveStuff', { id: '456', ...filter });

	return Response.json({
		collection: {
			cacheHint,
			entries,
			error: error ? { ...error, message: error.message } : undefined,
		},
		entryByObject,
		entryByString,
	});
};
