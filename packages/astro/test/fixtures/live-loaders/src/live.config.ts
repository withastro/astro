import { defineCollection, z, type BaseSchema } from 'astro:content';
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
		return entries[context.filter.id] || null;
	},
	loadCollection: async (context) => {
		return {
			entries: Object.values(entries),
		};
	},
};

const liveStuff = defineCollection({
	type: 'live',
	loader,
});

export const collections = { liveStuff };
