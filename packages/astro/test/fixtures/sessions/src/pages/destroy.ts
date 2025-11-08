import type { EndpointHandler } from 'astro';

export const GET: EndpointHandler = async (context) => {
	await context.session.destroy();
	return Response.json({});
};
