import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
	ping: defineAction({
		input: z.object({
			message: z.string(),
		}),
		handler: async ({ message }) => {
			return { message };
		},
	}),
};
