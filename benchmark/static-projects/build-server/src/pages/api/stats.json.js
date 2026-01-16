export async function GET({ params, request }) {
	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		pageViews: Math.floor(Math.random() * 100000),
		uniqueVisitors: Math.floor(Math.random() * 10000),
		bounceRate: (Math.random() * 100).toFixed(2),
		avgSessionDuration: Math.floor(Math.random() * 600),
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}