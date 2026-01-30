export const prerender = false;

export async function GET({ params, request }) {
	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		data: Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			title: `Item ${i + 1}`,
		})),
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}