import { type APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  return new Response(null, { status: 200 });
};
