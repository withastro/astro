export function GET() {
	return new Response('x'.repeat(300 * 1024));
}
