export function GET() {
	return new Response(null, { status: 304, headers: { location: '/target' } });
}
