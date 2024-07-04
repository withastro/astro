import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { loader } from '../loaders/post-loader.js';

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

const spacecraft = defineCollection({
	type: 'experimental_data',
	loader: glob({ pattern: '*', base: 'content-outside-src' }),
});

const numbers = defineCollection({
	type: 'experimental_data',
	loader: glob({ pattern: 'src/data/glob-data/*', base: '.' }),
});

export const collections = { blog, dogs, cats, numbers, spacecraft };
