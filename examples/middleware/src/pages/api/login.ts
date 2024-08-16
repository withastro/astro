import type { APIRoute, APIContext } from "astro";

export const POST: APIRoute = async (context: APIContext) => {
  try {
    const data = await context.request.formData();
    return new Response(
      JSON.stringify({
        username: data.get("username"),
        password: data.get("password"),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    }
  }
  return new Response(null, { status: 400 });
};
