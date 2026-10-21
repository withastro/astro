export function getStaticPaths() {
	return [{ params: { slug: 'no-body' }, cacheKey: 'v1' }];
}

export function GET() {
	return new Response(null);
}
