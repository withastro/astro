export function get() {
	const object = {
		name: 'Endpoint!!',
	};
	return new Response(JSON.stringify(object), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
