import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		// @ts-ignore This should throw an error because liveStuff is a live collection
		const collection = await getCollection('liveStuff');
		return Response.json({ collection });
	} catch (error: any) {
		return Response.json(
			{
				error: error.message
			},
			{
				status: 500,
			},
		);
	}
};
