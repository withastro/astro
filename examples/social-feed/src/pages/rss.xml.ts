import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { sortPosts } from '../helpers/getSortedPosts';
import settings from '../settings';
import { getCollection } from 'astro:content';

const { title, description } = settings.rss;

export async function GET(context: APIContext) {
	const posts = await getCollection('articles');

	return rss({
		// `<title>` field in output xml
		title,
		// `<description>` field in output xml
		description,
		// Pull in your project "site" from the endpoint context
		// https://docs.astro.build/en/reference/api-reference/#contextsite
		site: context.site!.href,
		// Array of `<item>`s in output xml
		// See "Generating items" section for examples using content collections and glob imports
		items: posts
			.sort(sortPosts())
			.map(({ data, slug }) => ({ ...data, link: `/post/${slug}` })),
		stylesheet: '/rss/styles.xsl',
	});
}
