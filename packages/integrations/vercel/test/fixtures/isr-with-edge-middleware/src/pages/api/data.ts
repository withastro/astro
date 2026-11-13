import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) => Response.json({ ok: true, query: url.search });
