import { getCollection } from 'astro:content';
import { stringify } from 'devalue';
import { stripAllRenderFn } from '../../utils.js';

export async function get() {
	const posts = await getCollection('blog');
	return new Response(stringify(stripAllRenderFn(posts)));
}
