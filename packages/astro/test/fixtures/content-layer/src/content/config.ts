import { defineCollection, file, z } from 'astro:content';
import { loader } from '../loaders/post-loader.js';

const blog = defineCollection({
	type: "experimental_data",
	loader: loader({ url: "https://jsonplaceholder.typicode.com/posts" }),
});

const dogs = defineCollection({
	type: "experimental_data",
	loader: file("_data/dogs.json"),
	schema: z.object({
		breed: z.string(),
		id: z.string(),
		size: z.string(),
		origin: z.string(),
		lifespan: z.string(),
		temperament: z.array(z.string())
	}),
})
export const collections = { blog, dogs };
