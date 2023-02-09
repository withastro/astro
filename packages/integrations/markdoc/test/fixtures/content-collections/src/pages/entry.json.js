import { getEntryBySlug } from 'astro:content';
import { stringify } from 'devalue';
import { stripRenderFn } from '../../utils.js';

export async function get() {
	const post = await getEntryBySlug('blog', 'simple');
	return {
		body: stringify(stripRenderFn(post)),
	};
}
