import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
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
