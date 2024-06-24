import { defineCollection, z } from 'astro:content';
import { loader } from '../loaders/post-loader.js';

const blog = defineCollection({
	type: "experimental_content",
	name: "blog",
	loader: loader({ url: "https://jsonplaceholder.typicode.com/posts" }),
});

export const collections = { blog };
