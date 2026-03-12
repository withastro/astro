export const prerender = false;

export const GET = async (context) => {
	context.cache.set({ maxAge: 300, swr: 60, tags: ['data'] });
	return Response.json({ timestamp: Date.now() });
};
