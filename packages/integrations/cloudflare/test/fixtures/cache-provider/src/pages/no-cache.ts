export const prerender = false;

// Explicitly opt out of caching via `cache.set(false)`. The adapter's default
// `no-store` should still apply.
export const GET = async (context: any) => {
	context.cache.set(false);
	return Response.json({ ok: true });
};
