import { z, defineCollection, reference } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string().max(60, 'For SEO purposes, keep descriptions short!'),
		authors: reference('authors', { relation: 'many' }),
	}),
});

const authors = defineCollection({
	type: 'data',
	getId({ fileId }) {
		return fileId.replace(/\.json$/, '');
	},
	schema: z.object({
		name: z.string(),
		website: z.string().url(),
	}),
});

export const collections = { blog, authors };

// i18n ideas??

const i18n = defineCollection({
	type: 'data',
	schema: z.record(z.string()),
});

function withI18n<T extends z.ZodObject<any>>(schema: T) {
	return ({ id }: { id: string }) =>
		z
			.object({
				i18n: reference('i18n', { default: id.split('/')[0] }),
			})
			.extend(schema);
}
