export async function GET({ request }) {
  return fetch("https://http.im/status/500", request)
}
