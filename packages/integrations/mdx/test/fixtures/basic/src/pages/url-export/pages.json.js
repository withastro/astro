export async function get() {
	const mdxPages = await import.meta.glob('./*.mdx', { eager: true });

	return {
		body: JSON.stringify({
			urls: Object.values(mdxPages ?? {}).map(v => v?.url),
		})
	}
}
