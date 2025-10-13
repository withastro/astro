import type { APIRoute } from "astro";

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
  return new Response(ctx.body, { status: ctx.status, headers: ctx.headers });
};
