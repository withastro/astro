import type { EndpointHandler } from 'astro';

export const GET: EndpointHandler = async (context) => {
	await context.session.regenerate();
	return Response.json({});
};
