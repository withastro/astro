import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [
		{
			name: 'record-storage-handles',
			hooks: {
				'astro:build:done': ({ collections }) => {
					globalThis.collectionStorageHandles = collections.storage;
				},
			},
		},
	],
	experimental: {
		collectionStorageDrivers: true,
	},
});
