import type { EndpointHandler } from 'astro';

export const GET: EndpointHandler = async function () {
  return new Response("hello world", { status: 403, headers: { "x-hello": 'world' } });
};
