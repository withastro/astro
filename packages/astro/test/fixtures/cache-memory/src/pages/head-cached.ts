export const prerender = false;

export const GET = async (context) => {
	context.cache.set({ maxAge: 300, tags: ['head-cached'] });
	return Response.json({ timestamp: Date.now() });
};
