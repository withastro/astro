import { rssSchema } from '@astrojs/rss';
import { defineCollection, z } from 'astro:content';

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
			type: z.literal('article').default('article')
		})
		.required({
			// requiring the description for articles, this will be shown as the short preview text on cards
			description: true
		})
		.strict(),
})

const notes = defineCollection({
	schema: rssSchema
		.extend({
			type: z.literal('note').default('note')
		})
		.omit({
			// notes are short, self-contained content without unique titles or descriptions
			description: true,
			title: true
		})
		.strict()
})

export const collections = { articles, notes };
