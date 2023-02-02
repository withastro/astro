import { getCollection } from 'astro:content';

export async function get() {
	const collection = await getCollection('rss-markdown')
	const result = {}
	await Promise.all(collection.map(async (item) => {
		result[item.slug] = (await item.render()).html
	}))
	return {
		body: JSON.stringify(result)
	}
}
