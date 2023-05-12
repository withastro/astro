
export function get(context) {
  return {
    body: `hello world: ${context.locals?.foo ?? "null"}`
  };
}
