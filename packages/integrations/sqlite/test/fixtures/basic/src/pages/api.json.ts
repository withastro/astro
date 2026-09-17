import { getLiveCollection, getLiveEntry } from 'astro:content';

function serialize(result: unknown) {
	return JSON.parse(
		JSON.stringify(result, (_key, value) => {
			if (value instanceof Error) return { name: value.name, message: value.message };
			return value;
		}),
	);
}

export async function GET() {
	const [all, published, tagged, selected, ordered, paged, nested, byId, byWhere, missing, authors, search] =
		await Promise.all([
			getLiveCollection('posts'),
			getLiveCollection('posts', { where: { draft: false }, orderBy: { pubDate: 'desc' } }),
			getLiveCollection('posts', { where: { tags: { includes: 'content' } } }),
			getLiveCollection('posts', { select: ['title', 'pubDate'], orderBy: { views: 'desc' }, limit: 2 }),
			getLiveCollection('posts', {
				where: { OR: [{ views: { gte: 300 } }, { title: { startsWith: 'Hello' } }] },
				orderBy: [{ views: 'asc' }],
			}),
			getLiveCollection('posts', { orderBy: { pubDate: 'asc' }, limit: 2, offset: 1 }),
			getLiveCollection('posts', { where: { author: { id: 'ada' }, meta: { featured: true } } }),
			getLiveEntry('posts', 'hello-world'),
			getLiveEntry('posts', { where: { tags: { includesAll: ['sqlite', 'astro'] } } }),
			getLiveEntry('posts', 'does-not-exist'),
			getLiveCollection('authors', { where: { website: { isNull: true } } }),
			getLiveCollection('posts', {
				where: { title: { contains: 'post' }, pubDate: { gt: new Date('2024-02-01') } },
			}),
		]);

	return Response.json(
		serialize({
			all,
			published,
			tagged,
			selected,
			ordered,
			paged,
			nested,
			byId,
			byWhere,
			missing,
			authors,
			search,
			pubDateIsDate: all.entries?.[0]?.data.pubDate instanceof Date,
		}),
	);
}
