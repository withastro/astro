import type { Loader } from 'astro:content';

export interface PostLoaderConfig {
	url: string;
}

export function loader(config:PostLoaderConfig): Loader {
	return {
		name: "post-loader",
		load: async ({
			store, collection, meta, logger
		}) => {
			logger.info('Loading posts');

			const lastSynced = meta.get('lastSynced');

			// Don't sync more than once a minute
			if (lastSynced && (Date.now() - Number(lastSynced) < 1000 * 60)) {
					logger.info('Skipping sync');
					return;
			}

			const posts = await fetch(config.url)
				.then((res) => res.json());

			store.clear();

			for (const post of posts) {
				store.set(post.id, post);
			}
			meta.set('lastSynced', String(Date.now()));
		},
	};
}
