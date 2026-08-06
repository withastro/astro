export const prerender = false;

export const GET = async (context: any) => {
	context.cache.set({ maxAge: 300, swr: 60, tags: ['api', 'data'] });
	return Response.json({ ok: true });
};
