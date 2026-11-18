import { getCollection } from 'astro:content';
import { stringify } from 'devalue';

export async function GET() {
	const posts = await getCollection('blog');
	return new Response(stringify(posts));
}
