import type { Loader } from 'astro:content';

export interface PostLoaderConfig {
	url: string;
}

export function loader(config:PostLoaderConfig): Loader {
	return {
		name: "post-loader",
		load: async ({
			store, collection, cache
		}) => {
			console.log('loading posts');
			const posts = await fetch(config.url)
				.then((res) => res.json());
			
			store.clear(collection);

			for (const post of posts) {
				store.set(collection, post.id, post);
			}
		},
	};
}
