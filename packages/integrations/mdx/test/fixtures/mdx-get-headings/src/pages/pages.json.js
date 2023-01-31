export async function get() {
	const mdxPages = await import.meta.glob('./*.mdx', { eager: true });

	return {
		body: JSON.stringify({
			headingsByPage: Object.fromEntries(
				Object.entries(mdxPages ?? {}).map(([k, v]) => [k, v?.getHeadings()])
			),
		}),
	}
}
