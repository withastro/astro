import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	const body = await context.request.json() as any;
	await context.session.regenerate();
	context.session.set('user', body.username);
	return Response.json({ username: body.username });
};
