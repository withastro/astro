export async function GET({ params, request }) {
	const users = Array.from({ length: 50 }, (_, i) => ({
		id: i + 1,
		name: `User ${i + 1}`,
		email: `user${i + 1}@example.com`,
		active: Math.random() > 0.5,
	}));

	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		users,
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}