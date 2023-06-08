export async function get({ request }: { request: Request }) {
  const headers = new Headers();
	return new Response('hello world', { headers });
}
