// Type-level checks for the loader's filter API. This file is only type-checked, never executed.
import { getLiveCollection, getLiveEntry } from 'astro:content';

export async function checks() {
	const posts = await getLiveCollection('posts', {
		select: ['title', 'pubDate'],
		where: {
			draft: false,
			views: { gte: 10, lt: 100 },
			pubDate: { gt: new Date('2024-01-01') },
			tags: { includes: 'astro', includesAll: ['a', 'b'] },
			title: { startsWith: 'Hello' },
			author: { id: 'ada' },
			meta: { featured: true },
			id: { in: ['hello-world'] },
			OR: [{ views: 1 }, { NOT: { draft: true } }],
		},
		orderBy: [{ pubDate: 'desc' }, { id: 'asc' }],
		limit: 10,
		offset: 0,
		rendered: true,
	});
	if (posts.entries) {
		const first = posts.entries[0];
		const title: string = first.data.title;
		const date: Date = first.data.pubDate;
		return { title, date };
	}
	// The loader's own error type is part of the union.
	if (posts.error?.name === 'SqliteLoaderError') {
		return posts.error.collection;
	}

	await getLiveEntry('posts', 'hello-world');
	await getLiveEntry('posts', { where: { author: { id: 'ada' } }, orderBy: { views: 'desc' } });

	// @ts-expect-error title is a string
	await getLiveCollection('posts', { where: { title: 5 } });
	// @ts-expect-error unknown field
	await getLiveCollection('posts', { where: { nope: 'x' } });
	// @ts-expect-error array fields do not accept scalar operators
	await getLiveCollection('posts', { where: { tags: { gt: 'x' } } });
	// @ts-expect-error select only accepts data keys
	await getLiveCollection('posts', { select: ['nope'] });
	// @ts-expect-error invalid sort direction
	await getLiveCollection('posts', { orderBy: { views: 'up' } });
}
