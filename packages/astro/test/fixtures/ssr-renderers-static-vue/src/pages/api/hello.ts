export const prerender = false;

export async function GET() {
	return new Response(JSON.stringify({ ok: true }), {
		headers: {
			'content-type': 'application/json',
		},
	});
}
