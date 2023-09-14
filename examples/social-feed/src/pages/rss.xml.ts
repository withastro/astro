import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts } from '../helpers/getSortedPosts';
import settings from '../settings';

const { title, description } = settings.rss;

export async function get(context: APIContext) {
	const posts = await getSortedPosts();
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
		items: posts.map(({ data, slug }) => ({ ...data, link: `/post/${slug}` })),
		stylesheet: '/rss/styles.xsl',
	});
}
