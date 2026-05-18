export const prerender = false;

export const GET = async (context) => {
	// No cache.set() — should pass through without caching
	return Response.json({ timestamp: Date.now() });
};
