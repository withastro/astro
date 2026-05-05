import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
	test: defineAction({
		input: z.object({ name: z.string() }),
		handler: async (input) => {
			return `Hello ${input.name}`;
		},
	}),
};
