import { rssSchema } from '@astrojs/rss';
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	schema: ({ image }) => rssSchema
		.extend({
			tags: z.array(z.string()).default([]),
			cover: z
				.object({
					src: image().refine(
						(img) => img.width >= 885,
						'Cover image must be at least 885px wide.'
					),
					alt: z.string(),
				})
				.optional(),
			type: z.enum(['article', 'note']).default('note'),
		})
		.strict(),
});

export const collections = { posts };
