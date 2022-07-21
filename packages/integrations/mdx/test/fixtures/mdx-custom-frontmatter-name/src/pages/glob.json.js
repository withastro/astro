export async function get() {
	const mdxPages = await import.meta.glob('./*.mdx', { eager: true });

	return {
		body: JSON.stringify({
			titles: Object.values(mdxPages ?? {}).map(v => v?.customFrontmatter?.title),
		})
	}
}
