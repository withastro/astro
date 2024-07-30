import { defineCollection, z, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { loader } from '../loaders/post-loader.js';
import { fileURLToPath } from 'node:url';

const blog = defineCollection({
	type: 'experimental_data',
	loader: loader({ url: 'https://jsonplaceholder.typicode.com/posts' }),
});

const dogs = defineCollection({
	type: 'experimental_data',
	loader: file('src/data/dogs.json'),
	schema: z.object({
		breed: z.string(),
		id: z.string(),
		size: z.string(),
		origin: z.string(),
		lifespan: z.string(),
		temperament: z.array(z.string()),
	}),
});

const cats = defineCollection({
	type: 'experimental_data',
	loader: async function () {
		return [
			{
				breed: 'Siamese',
				id: 'siamese',
				size: 'Medium',
				origin: 'Thailand',
				lifespan: '15 years',
				temperament: ['Active', 'Affectionate', 'Social', 'Playful'],
			},
			{
				breed: 'Persian',
				id: 'persian',
				size: 'Medium',
				origin: 'Iran',
				lifespan: '15 years',
				temperament: ['Calm', 'Affectionate', 'Social'],
			},
			{
				breed: 'Tabby',
				id: 'tabby',
				size: 'Medium',
				origin: 'Egypt',
				lifespan: '15 years',
				temperament: ['Curious', 'Playful', 'Independent'],
			},
			{
				breed: 'Ragdoll',
				id: 'ragdoll',
				size: 'Medium',
				origin: 'United States',
				lifespan: '15 years',
				temperament: ['Calm', 'Affectionate', 'Social'],
			},
		];
	},
	schema: z.object({
		breed: z.string(),
		id: z.string(),
		size: z.string(),
		origin: z.string(),
		lifespan: z.string(),
		temperament: z.array(z.string()),
	}),
});

// Absolute paths should also work
const absoluteRoot = new URL('../../content-outside-src', import.meta.url);

const spacecraft = defineCollection({
	type: 'experimental_content',
	loader: glob({ pattern: '*.md', base: absoluteRoot }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			publishedDate: z.coerce.date(),
			tags: z.array(z.string()),
			heroImage: image().optional(),
			cat: reference('cats').optional(),
		}),
});

const numbers = defineCollection({
	type: 'experimental_content',
	loader: glob({ pattern: 'src/data/glob-data/*', base: '.' }),
});

const increment = defineCollection({
	type: 'experimental_data',
	loader: {
		name: 'increment-loader',
		load: async ({ store }) => {
			const entry = store.get<{ lastValue: number }>('value');
			const lastValue: number = entry?.data.lastValue ?? 0;
			store.set({
				id: 'value',
				data: {
					lastValue: lastValue + 1,
				},
			});
		},
	},
	schema: z.object({
		lastValue: z.number(),
	}),
});

export const collections = { blog, dogs, cats, numbers, spacecraft, increment };
