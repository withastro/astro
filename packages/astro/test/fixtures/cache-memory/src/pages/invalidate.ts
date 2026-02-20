export const prerender = false;

export const POST = async (context) => {
	await context.cache.invalidate({ tags: ['data'] });
	return Response.json({ invalidated: true });
};
