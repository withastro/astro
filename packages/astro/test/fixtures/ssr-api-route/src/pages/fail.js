export async function GET({ request }) {
  return fetch(new URL("/500", request.url), request);
}
