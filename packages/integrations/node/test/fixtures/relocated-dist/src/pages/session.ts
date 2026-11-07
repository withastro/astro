import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
	const previous = (await context.session.get('value')) ?? 'none';
	context.session.set('value', 'set');
	return Response.json({ previous });
};
