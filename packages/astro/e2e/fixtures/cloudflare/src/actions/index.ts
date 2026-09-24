import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
	addGreeting: defineAction({
		accept: "form",
		input: z.object({
			message: z.string()
		}),
		handler: async ({ message }) => {
			return {
				message: `Hello ${message}`
			}
		}
	})
}
