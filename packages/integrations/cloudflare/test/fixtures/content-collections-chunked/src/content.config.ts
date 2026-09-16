import { defineCollection } from 'astro:content';

const generated = defineCollection({
	loader: () => ({
		entry: {
			payload: ['a', 'b', 'c'].map((character) => character.repeat(1024 * 1024)).join(''),
		},
	}),
});

export const collections = { generated };
