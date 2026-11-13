import type { APIRoute } from 'astro';

export const GET: APIRoute = (ctx) => {
	return Response.json({ clientAddress: ctx.clientAddress });
};
