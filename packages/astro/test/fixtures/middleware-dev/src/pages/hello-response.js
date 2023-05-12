
export function get(context) {
  return new Response(`hello world: ${context.locals?.name ?? "null"}`, { status: 200 });
}
