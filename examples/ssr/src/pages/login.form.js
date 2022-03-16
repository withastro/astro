export function post(params, request) {
	return new Response(null, {
		status: 301,
		headers: {
			Location: '/',
			'Set-Cookie': 'user-id=1; Path=/; Max-Age=2592000',
		},
	});
}
