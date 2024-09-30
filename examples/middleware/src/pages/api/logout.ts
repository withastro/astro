import type { APIRoute, APIContext } from "astro";

export const GET: APIRoute = async (_: APIContext) => {
  return new Response(null, { status: 200 });
};
