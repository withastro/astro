export const prerender = false;

export const GET = async (context) => {
	// Explicitly disable caching
	context.cache.set(false);
	return Response.json({ cached: false });
};
