import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [
		{
			name: 'delete-build-snapshot',
			hooks: {
				// Nothing reads the snapshot of a static build once it's done
				'astro:build:done': async ({ collections }) => {
					const [storage] = collections.storage;
					await storage.deleteSnapshot(storage.snapshot);
					globalThis.sqliteBuildDone = {
						snapshot: storage.snapshot,
						readAtRuntime: storage.readAtRuntime,
						remaining: (await storage.listSnapshots()).map(({ snapshot }) => snapshot),
					};
				},
			},
		},
	],
	experimental: {
		collectionStorageDrivers: true,
	},
});
