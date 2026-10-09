export const prerender = false;

// No cache.set() call and no matching routeRule. The adapter should default
// to `Cloudflare-CDN-Cache-Control: no-store` so the Worker cache doesn't
// accidentally cache this response.
export const GET = async () => {
	return Response.json({ ok: true });
};
