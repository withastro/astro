
export function get(context) {
  return new Response(`hello world: ${context.locals?.foo ?? "null"}`, { status: 200 });
}
