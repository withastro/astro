import { defineAction, ActionError, z } from 'astro:actions';

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
	getUser: defineAction({
		accept: 'form',
		handler: async (_, { locals }) => {
			return locals.user;
		}
	}),
	getUserOrThrow: defineAction({
		accept: 'form',
		handler: async (_, { locals }) => {
			if (locals.user?.name !== 'admin') {
				// Expected to throw
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'Not logged in',
				});
			}
			return locals.user;
		}
	}),
	fireAndForget: defineAction({
		handler: async () => {
			return;
		}
	}),
};
