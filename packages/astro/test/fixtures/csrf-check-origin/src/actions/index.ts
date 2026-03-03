import { defineAction } from 'astro:actions';

export const server = {
	getSecret: defineAction({
		handler: async () => {
			return { secret: 'sensitive-data' };
		},
	}),
};
