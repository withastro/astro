// import { rssSchema } from '@astrojs/rss';
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	// TODO: Extend rssSchema here — was doing that in my standalone project but seems to be broken in the monorepo.
  schema: z
    .object({ title: z.string(), description: z.string().optional(), pubDate: z.date() })
		.extend({
      tags: z.array(z.string()).default([]),
      cover: z
        .object({
          src: z.string(),
					// TODO: Support experimental assets instead of plain string schema:
          // image().refine(
          //   (img) => img.width >= 885,
          //   'Cover image must be at least 885px wide.'
          // )
          alt: z.string(),
        })
        .optional(),
      type: z.enum(['article', 'tweet']).default('tweet'),
    })
    .strict(),
});

export const collections = { posts };
