import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { getCollection } from 'astro:content';
import { addComment, incrementLikes } from '../db/store';

export const server = {
	logout: defineAction({
		handler: async () => {
			await new Promise((r) => setTimeout(r, 500));
		},
	}),
	blog: {
		like: defineAction({
			input: z.object({ postId: z.string() }),
			handler: async ({ postId }) => {
				await new Promise((r) => setTimeout(r, 500));

				return incrementLikes(postId);
			},
		}),

		comment: defineAction({
			accept: 'form',
			input: z.object({
				postId: z.string(),
				author: z.string(),
				body: z.string().min(10),
			}),
			handler: async ({ postId, author, body }) => {
				if (!(await getCollection('blog')).find((b) => b.id === postId)) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Post not found',
					});
				}

				return addComment({ postId, author, body });
			},
		}),

		apply: defineAction({
			accept: 'form',
			input: z.object({
				name: z.string().min(2),
				email: z.string().email(),
			}),
			handler: async ({ name, email }) => {
				return { name, email, submitted: true };
			},
		}),

		lotsOfStuff: defineAction({
			accept: 'form',
			input: z.object({
				one: z.string().min(3),
				two: z.string().min(3),
				three: z.string().min(3),
				four: z.string().min(3),
				five: z.string().min(3),
				six: z.string().min(3),
				seven: z.string().min(3),
				eight: z.string().min(3),
				nine: z.string().min(3),
				ten: z.string().min(3),
			}),
			handler(form) {
				return form;
			},
		}),
	},
	sum: defineAction({
		accept: 'form',
		input: z.object({
			a: z.number(),
			b: z.number(),
		}),
		async handler({ a, b }) {
			return a + b;
		},
	}),
};
