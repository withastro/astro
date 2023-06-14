import { getCollection } from 'astro:content';

/** Get everything in your posts collection, sorted by date. */
export async function getSortedPosts(order: 'asc' | 'desc' = 'desc') {
  const posts = await getCollection('posts');
  posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  if (order === 'asc') posts.reverse();
  return posts;
}
