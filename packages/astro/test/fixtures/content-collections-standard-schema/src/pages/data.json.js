import { getCollection, getEntry } from 'astro:content';

export async function GET() {
	const blogEntries = await getCollection('blog');
	const bannerEntries = await getCollection('banners');

	const welcomePost = blogEntries.find((e) => e.id === 'welcome');
	const welcomeBanner = bannerEntries.find((e) => e.id === 'welcome');

	return Response.json({
		welcomePost,
		welcomeBanner,
	});
}
