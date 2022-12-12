import { getCollection } from 'astro:content';

export async function get() {
	const blog = await getCollection('blog');
	return {
		body: JSON.stringify(blog),
	}
}
