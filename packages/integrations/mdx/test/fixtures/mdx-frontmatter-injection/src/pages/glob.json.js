export async function GET() {
	const docs = await import.meta.glob('./*.mdx', { eager: true });
	return {
		body: JSON.stringify(Object.values(docs).map(doc => doc.frontmatter)),
	}
}
