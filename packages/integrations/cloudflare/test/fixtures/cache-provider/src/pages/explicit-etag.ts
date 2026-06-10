export const prerender = false;

// An explicitly provided ETag must be respected verbatim — the provider should
// not override it with a deploy-aware validator.
export const EXPLICIT_ETAG = '"user-provided"';

export const GET = async (context: any) => {
	context.cache.set({ maxAge: 300, tags: ['explicit'], etag: EXPLICIT_ETAG });
	return Response.json({ ok: true });
};
