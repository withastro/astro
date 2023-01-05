import { z, defineCollection } from 'astro:content';

const withSlugConfig = defineCollection({
	slug({ id, data }) {
		return `${data.prefix}-${id}`;
	},
	schema: z.object({
		prefix: z.string(),
	})
});

const withSchemaConfig = defineCollection({
	schema: z.object({
		title: z.string(),
		isDraft: z.boolean().default(false),
		lang: z.enum(['en', 'fr', 'es']).default('en'),
		publishedAt: z.date().transform((val) => new Date(val)),
	})
});

export const collections = {
	'with-slug-config': withSlugConfig,
	'with-schema-config': withSchemaConfig,
}
