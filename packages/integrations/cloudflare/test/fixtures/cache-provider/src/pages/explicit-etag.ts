export const prerender = false;

export const GET = async (context: any) => {
	context.cache.set({
		maxAge: 300,
		lastModified: new Date('2026-01-15T10:00:00.000Z'),
		etag: '"user-supplied"',
	});
	return Response.json({ ok: true });
};
