export function GET() {
	return new Response('<feed><title>Incremental build fixture</title></feed>', {
		headers: {
			'content-type': 'application/xml',
		},
	});
}
