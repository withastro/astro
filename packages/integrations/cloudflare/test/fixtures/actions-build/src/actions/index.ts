import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
	contact: defineAction({
		accept: 'form',
		input: z.object({
			email: z.string().email(),
		}),
		handler: async ({ email }) => ({ email }),
	}),
};
