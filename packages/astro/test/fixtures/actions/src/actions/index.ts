import { defineAction, z } from 'astro:actions';

export const server = {
	subscribe: defineAction({
		input: z.object({ channel: z.string() }),
		handler: async ({ channel }) => {
			return {
				channel,
				subscribeButtonState: 'smashed',
			};
		},
	}),
	comment: defineAction({
		accept: 'form',
		input: z.object({ channel: z.string(), comment: z.string() }),
		handler: async ({ channel, comment }) => {
			return {
				channel,
				comment,
			};
		},
	}),
	commentPlainFormData: defineAction({
		accept: 'form',
		handler: async (formData) => {
			return {
				success: true,
				isFormData: formData instanceof FormData,
			};
		},
	}),
};
