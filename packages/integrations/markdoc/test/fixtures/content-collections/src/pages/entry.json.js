import { stringify } from 'devalue';
import { stripRenderFn } from '../../utils.js';
import { getEntryBySlug } from 'astro:content';

export async function GET() {
	const post = await getEntryBySlug('blog', 'post-1');
	return new Response(stringify(stripRenderFn(post)));
}
