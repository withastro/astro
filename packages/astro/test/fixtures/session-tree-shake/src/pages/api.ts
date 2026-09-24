import type { APIRoute } from 'astro';

// Reports whether `context.session` is defined. When no driver is wired
// (no adapter default, no user config), it is `undefined`; when a driver
// is configured, it is an `AstroSession`.
export const GET: APIRoute = (context) => {
	return Response.json({ hasSession: context.session != null });
};
