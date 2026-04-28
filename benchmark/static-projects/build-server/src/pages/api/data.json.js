export async function GET({ params, request }) {
	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		random: Math.random(),
		data: Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			title: `Item ${i + 1}`,
			value: Math.random() * 1000,
		})),
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}