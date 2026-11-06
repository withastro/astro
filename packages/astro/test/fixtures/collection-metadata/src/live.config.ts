import { defineLiveCollection } from 'astro:content';
import type { LiveLoader } from 'astro/loaders';

const loader: LiveLoader<{ title: string }> = {
	name: 'products-loader',
	descriptors: { library: 'shop' },
	loadEntry: async () => ({ id: 'a', data: { title: 'A' } }),
	loadCollection: async () => ({ entries: [{ id: 'a', data: { title: 'A' } }] }),
};

export const collections = {
	products: defineLiveCollection({ loader, descriptors: { featured: true } }),
};
