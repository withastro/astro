import { defineCollection, z } from 'astro:content';
import type { LiveLoader } from 'astro/loaders';

type Entry = {
	title: string;
};

const entries = {
	'123': { id: '123', data: { title: 'Page 123' } },
	'456': { id: '456', data: { title: 'Page 456' } },
	'789': { id: '789', data: { title: 'Page 789' } },
};

const loader: LiveLoader<Entry, { id: keyof typeof entries }> = {
	name: 'test-loader',
	loadEntry: async (context) => {
		if(!entries[context.filter.id]) {
			return;
		}
		return {
			...entries[context.filter.id],
			cacheHint: {
				tags: [`page:${context.filter.id}`],
				maxAge: 60,
			},
		};
	},
	loadCollection: async (context) => {
		return {
			entries: Object.values(entries),
			cacheHint: {
				tags: ['page'],
				maxAge: 60,
			},
		};
	},
};

const liveStuff = defineCollection({
	type: 'live',
	loader,
	schema: z.object({
		title: z.string(),
		age: z.number().optional(),
	}),
});

export const collections = { liveStuff };
