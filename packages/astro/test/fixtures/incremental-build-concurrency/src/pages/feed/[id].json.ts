import { getEntry, render } from 'astro:content';

export async function getStaticPaths() {
	// Rendered during getStaticPaths, outside any path's render: this entry must
	// not be attributed to any path.
	const gspOnly = await getEntry('docs', 'gsp-only');
	await render(gspOnly!);
	return [{ params: { id: 'main' }, cacheKey: 'v1' }];
}

export async function GET() {
	const entry = await getEntry('docs', 'feed');
	const { headings } = await render(entry!);
	return Response.json({ headings: headings.map((h) => h.text) });
}
