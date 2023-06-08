import { getEntry, getEntries } from 'astro:content';

export async function get() {
	const welcomePost = await getEntry('blog', 'welcome');

	if (!welcomePost?.data) {
		return { 
			body: { error: 'blog/welcome did not return `data`.' },
		}
	}

	const banner = await getEntry(welcomePost.data.banner);
	const author = await getEntry(welcomePost.data.author);
	const rawRelatedPosts = await getEntries(welcomePost.data.relatedPosts ?? []);
	const relatedPosts = rawRelatedPosts.map(({ render /** filter out render() function */, ...p }) => p);

	return {
		body: JSON.stringify({
			welcomePost,
			banner,
			author,
			relatedPosts,
		})
	}
}
