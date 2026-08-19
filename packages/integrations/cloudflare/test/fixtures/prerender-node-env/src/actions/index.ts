import { defineAction } from 'astro:actions';

export const server = {
	hello: defineAction({
		accept: 'json',
		handler: async (_, context) => {
			return {
				hasCf: 'cf' in context.request,
				message: 'Hello, World!',
			};
		},
	}),
};
