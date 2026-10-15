import type { APIRoute } from 'astro';

// With `session: false`, `context.session` is `undefined` (matching its
// `AstroSession | undefined` type), so user code can feature-detect it.
export const GET: APIRoute = (context) => {
	return Response.json({ hasSession: context.session != null });
};
