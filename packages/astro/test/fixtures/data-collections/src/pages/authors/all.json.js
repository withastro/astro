import { getCollection } from 'astro:content';

export async function GET() {
	const authors = await getCollection('authors-without-config');

	return {
		body: JSON.stringify(authors),
	}
}
