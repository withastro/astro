import type { APIRoute } from 'astro';

// Route that never accesses the session.
export const GET: APIRoute = () => Response.json({ ok: true });
