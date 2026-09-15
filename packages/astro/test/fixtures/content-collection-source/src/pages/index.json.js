import { getCollection, getEntry } from 'astro:content';

export const prerender = true;

export async function GET() {
	const [databasePosts, databasePost, localPosts, localPost] = await Promise.all([
		getCollection('databasePosts'),
		getEntry('databasePosts', 'beta'),
		getCollection('localPosts'),
		getEntry('localPosts', 'local'),
	]);

	return Response.json({ databasePosts, databasePost, localPosts, localPost });
}
