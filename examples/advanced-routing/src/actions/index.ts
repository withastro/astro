import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
	login: defineAction({
		accept: 'form',
		input: z.object({
			email: z.email(),
			password: z.string().min(1),
		}),
		handler: async (_input, context) => {
			// In a real app, validate credentials against a database here.
			context.cookies.set('session', '1', { path: '/' });
			return { success: true };
		},
	}),
	createTask: defineAction({
		accept: 'form',
		input: z.object({
			title: z.string().min(1, 'Title is required'),
		}),
		handler: async ({ title }) => {
			// In a real app, save to a database here.
			return { id: crypto.randomUUID(), title };
		},
	}),
};
