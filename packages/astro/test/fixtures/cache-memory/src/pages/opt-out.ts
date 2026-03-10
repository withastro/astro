export const prerender = false;

export const GET = async (context) => {
	context.cache.set(false);
	return Response.json({ timestamp: Date.now() });
};
