
export function get() {
	return {
		body: JSON.stringify([
			{ name: 'lettuce' },
			{ name: 'broccoli' },
			{ name: 'pizza' }
		])
	};
}

export async function post(params, request) {
	const body = await request.text();
	return new Response(body === `some data` ? `ok` : `not ok`, {
		status: 200,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});
}
