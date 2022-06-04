export async function get({ request }) {	
	return new Response(new URL(request.url).searchParams.get('query'));
}
