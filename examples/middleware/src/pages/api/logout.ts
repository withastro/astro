import type { APIRoute, APIContext } from "astro";

export const GET: APIRoute = async (context: APIContext) => {
  return new Response(null, { status: 200 });
};
