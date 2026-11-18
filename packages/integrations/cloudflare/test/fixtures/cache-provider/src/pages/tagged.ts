export const prerender = false;

// Cache options come from routeRules in astro.config.mjs.
export const GET = async () => {
	return Response.json({ ok: true });
};
