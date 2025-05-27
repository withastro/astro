import type { APIRoute } from 'astro';

export const GET: APIRoute = async function () {
  return new Response("hello world", { status: 403, headers: { "x-hello": 'world' } });
};
