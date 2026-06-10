export const prerender = false;

// Sets a content `lastModified` so we can assert the deploy-aware ETag combines
// the Worker version id with the content timestamp.
export const LAST_MODIFIED = new Date('2024-01-01T00:00:00.000Z');

export const GET = async (context: any) => {
	context.cache.set({ maxAge: 300, tags: ['lastmod'], lastModified: LAST_MODIFIED });
	return Response.json({ ok: true });
};
