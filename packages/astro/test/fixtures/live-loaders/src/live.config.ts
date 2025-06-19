import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import type { LiveLoader } from 'astro/loaders';

type Entry = {
	title: string;
	age?: number;
};

interface CollectionFilter {
	addToAge?: number;
	returnInvalid?: boolean;
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

class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CustomError';
	}
}

const loader: LiveLoader<Entry, EntryFilter, CollectionFilter, CustomError> = {
	name: 'test-loader',
	loadEntry: async ({ filter }) => {
		const entry = entries[filter.id];
		if (!entry) {
			return {
				error: new CustomError(`Entry ${filter.id} not found`),
			};
		}
		return {
			...entry,
			data: {
				title: entry.data.title,
				age: filter?.addToAge
					? entry.data.age
						? entry.data.age + filter.addToAge
						: filter.addToAge
					: entry.data.age,
			},
			cacheHint: {
				tags: [`page:${filter.id}`],
				maxAge: 60,
			},
		};
	},
	loadCollection: async ({filter}) => {
		return {
			entries: filter?.addToAge
				? Object.values(entries).map((entry) => ({
						...entry,
						data: {
							title: filter.returnInvalid ? 99 as any : entry.data.title,
							age: entry.data.age ? entry.data.age + filter!.addToAge! : undefined,
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

const liveStuff = defineLiveCollection({
	type: 'live',
	loader,
	schema: z.object({
		title: z.string(),
		age: z.number().optional(),
	}),
});

export const collections = { liveStuff };
