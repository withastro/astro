export const prerender = false;

export const POST = async (context) => {
	await context.cache.invalidate({ path: '/cached' });
	return Response.json({ invalidated: true });
};
