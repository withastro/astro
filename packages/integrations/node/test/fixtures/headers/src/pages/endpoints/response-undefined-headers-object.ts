export async function get({ request }: { request: Request }) {
	return new Response('hello world', { headers: undefined });
}
