import { stringify } from 'devalue';
import { stripAllRenderFn } from '../../utils.js';
import { getCollection } from 'astro:content';

export async function GET() {
	const posts = await getCollection('blog');
	return new Response(stringify(stripAllRenderFn(posts)));
}
