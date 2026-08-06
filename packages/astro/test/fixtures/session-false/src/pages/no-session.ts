import type { APIRoute } from 'astro';

// Route that never accesses session — used to verify that disabling
// sessions does not affect unrelated routes.
export const GET: APIRoute = () => Response.json({ ok: true });
