export const prerender = false;

export const GET = async (context) => {
	// This route is configured via config-level cache routes.
	// Don't call cache.set() — the config match should apply automatically.
	return Response.json({ fromConfig: true });
};
