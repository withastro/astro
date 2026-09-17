import { sqlite } from '@astrojs/sqlite/loader';
import { type CollectionEntry, defineLiveCollection } from 'astro:content';

export const collections = {
	posts: defineLiveCollection({ loader: sqlite<CollectionEntry<'posts'>['data']>() }),
	authors: defineLiveCollection({ loader: sqlite<CollectionEntry<'authors'>['data']>() }),
};
