import { defineCollection } from 'astro/config';
import { z } from 'astro/zod';
import type { LiveLoader } from 'astro/loaders';

type Entry = {
	title: string;
	age?: number;
};

interface CollectionFilter {
	addToAge?: number;
}

type EntryFilter = {
	id: keyof typeof entries;
	addToAge?: number;
};


const entries = {
	'123': { id: '123', data: { title: 'Page 123', age: 10 } },
	'456': { id: '456', data: { title: 'Page 456', age: 20 } },
	'789': { id: '789', data: { title: 'Page 789', age: 30 } },
};

const loader: LiveLoader<Entry, EntryFilter, CollectionFilter> = {
	name: 'test-loader',
	loadEntry: async (context) => {
		const entry = entries[context.filter.id];
		if (!entry) {
			return;
		}
		return {
			...entry,
			data: {
				...entry.data,
				age: context.filter?.addToAge
					? entry.data.age
						? entry.data.age + context.filter.addToAge
						: context.filter.addToAge
					: entry.data.age,
			},
			cacheHint: {
				tags: [`page:${context.filter.id}`],
				maxAge: 60,
			},
		};
	},
	loadCollection: async (context) => {
		return {
			entries: context.filter?.addToAge
				? Object.values(entries).map((entry) => ({
						...entry,
						data: {
							...entry.data,
							age: entry.data.age ? entry.data.age + context.filter!.addToAge! : undefined,
						},
					}))
				: Object.values(entries),
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
