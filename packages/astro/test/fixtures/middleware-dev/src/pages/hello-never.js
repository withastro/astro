
export function get(context) {
  console.error("** this should never run **");
  throw new Error("this should never run, middleware should return before this function get a chance to execute");
}
