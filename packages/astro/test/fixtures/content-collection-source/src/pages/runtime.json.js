import { getCollection, getEntry } from 'astro:content';

export async function GET() {
	return Response.json({
		databasePosts: await getCollection('databasePosts'),
		localPost: await getEntry('localPosts', 'local'),
	});
}
