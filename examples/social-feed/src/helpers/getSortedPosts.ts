import { getCollection } from 'astro:content';
import type { Article, Note } from '../content/config';

export function sortPosts(order: 'asc' | 'desc' = 'desc') {
	return function(a: Article | Note, b: Article | Note) {
		return order === 'asc'
			? a.data.pubDate.getTime() - b.data.pubDate.getTime()
			: b.data.pubDate.getTime() - a.data.pubDate.getTime()
	}
}

/** Get everything in your posts collection, sorted by date. */
export async function getSortedPosts(order: 'asc' | 'desc' = 'desc') {
	const posts = await Promise.all([
		getCollection('articles'),
		getCollection('notes'),
	])
		.then((collections) => collections
			.flat()
			.sort(sortPosts(order)
		));

	return posts;
}
