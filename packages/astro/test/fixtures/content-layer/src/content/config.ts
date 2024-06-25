import { defineCollection, z } from 'astro:content';
import { loader } from '../loaders/post-loader.js';

const blog = defineCollection({
	type: "experimental_data",
	name: "blog",
	loader: loader({ url: "https://jsonplaceholder.typicode.com/posts" }),
});

export const collections = { blog };
