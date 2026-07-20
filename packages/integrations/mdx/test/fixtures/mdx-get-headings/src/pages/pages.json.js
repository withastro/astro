export async function GET() {
	const mdxPages = await import.meta.glob('./*.mdx', { eager: true });
	const entries = Object.entries(mdxPages ?? {});
	return Response.json({
		headingsByPage: Object.fromEntries(entries.map(([k, v]) => [k, v?.getHeadings()])),
		frontmatterByPage: Object.fromEntries(entries.map(([k, v]) => [k, v?.frontmatter])),
	});
}
