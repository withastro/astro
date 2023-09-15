import { rssSchema } from '@astrojs/rss';
import { defineCollection, z, type CollectionEntry } from 'astro:content';

const articles = defineCollection({
	schema: ({ image }) => rssSchema
		.extend({
			cover: z
				.object({
					src: image().refine(
						(img) => img.width >= 885,
						'Cover image must be at least 885px wide.'
					),
					alt: z.string(),
				})
				.optional(),
		})
		.required({
			// requiring the description for articles, this will be shown as the short preview text on cards
			title: true,
			description: true
		})
		.strict(),
})

const notes = defineCollection({
	schema: rssSchema
		.omit({
			// notes are short, self-contained content without unique titles or descriptions
			description: true,
			title: true
		})
		.strict()
})

export const collections = { articles, notes };

export type Article = CollectionEntry<'articles'>;
export type Note = CollectionEntry<'notes'>;
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
export type Post = Article | Note;

export function isArticle(post: Post): post is Article {
	return post.collection === 'articles'
}

export function isNote(post: Post): post is Note {
	return post.collection === 'notes'
}
