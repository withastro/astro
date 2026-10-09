export const prerender = false;

const LAST_MODIFIED = new Date('2026-01-15T10:00:00.000Z');

export const GET = async (context: any) => {
	context.cache.set({ maxAge: 300, lastModified: LAST_MODIFIED });
	return Response.json({ ok: true });
};
