import type { APIRoute } from 'astro';

// Never resolves — simulates a stalled keep-alive connection.
export const GET: APIRoute = () => new Promise<Response>(() => {});
