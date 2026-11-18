export function getStaticPaths() {
	return [{ params: { slug: 'not-found' }, cacheKey: 'v1' }];
}

export function GET() {
	return new Response(Uint8Array.from([0, 255, 128, 65]), {
		status: 404,
		statusText: 'Expected Not Found',
		headers: { 'x-astro-prerender-error': 'user-defined response header' },
	});
}
