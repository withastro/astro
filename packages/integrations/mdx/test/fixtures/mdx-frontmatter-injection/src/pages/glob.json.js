export async function get() {
	const docs = await import.meta.glob('./*.mdx', { eager: true });
	return new Response(
		JSON.stringify(Object.values(docs).map(doc => doc.frontmatter))
	);
}
