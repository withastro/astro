import { type ActionInputSchema, defineAction, type InferKey } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
	getGreeting: defineAction({
		input: z.object({
			name: z.string(),
		}),
		handler: async (input) => {
			return `Hello, ${input.name}!`;
		},
	}),
};

type Action = typeof server.getGreeting;
type X = ActionInputSchema<Action>;
type B = Action[InferKey];
