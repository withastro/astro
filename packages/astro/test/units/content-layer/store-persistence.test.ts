import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { createTempDir } from './test-helpers.ts';

/**
 * Persistence helpers for the two store modes:
 * - file: single data-store.json
 * - dir:  chunked data-store/ directory (experimental dataStoreChunking)
 */
interface PersistenceMode {
	label: string;
	/** Save a store to disk */
	save: (store: MutableDataStore, dir: URL) => Promise<void>;
	/** Load a store from disk */
	load: (dir: URL) => Promise<MutableDataStore>;
}

const modes: PersistenceMode[] = [
	{
		label: '',
		async save(store, dir) {
			const file = new URL('./data-store.json', dir);
			await fs.writeFile(file, store.toString());
		},
		async load(dir) {
			const file = new URL('./data-store.json', dir);
			return MutableDataStore.fromFile(fileURLToPath(file));
		},
	},
	{
		label: 'chunking enabled',
		async save(store, _dir) {
			// fromDir sets up the internal state for chunked writes;
			// writeToDisk dispatches to writeToDir when chunking is active.
			await store.writeToDisk();
		},
		async load(dir) {
			const storeDir = new URL('./data-store/', dir);
			return MutableDataStore.fromDir(storeDir);
		},
	},
];

for (const mode of modes) {
	const suiteName = 'Content Layer - Store Persistence' + (mode.label ? ` (${mode.label})` : '');

	describe(suiteName, () => {
		it('updates the store on new builds', async () => {
			const tempDir = createTempDir();

			// First build - create initial data
			let store1: MutableDataStore;
			if (mode.label) {
				// For chunked mode, load from dir to initialize chunking state
				store1 = await mode.load(tempDir);
			} else {
				store1 = new MutableDataStore();
			}
			store1.set('dogs', 'beagle', {
				id: 'beagle',
				data: { breed: 'Beagle', temperament: ['Friendly'] },
			});

			// Save to disk
			await mode.save(store1, tempDir);

			// Second build - load from disk and update
			const store2 = await mode.load(tempDir);

			// Verify existing data persists
			const beagle = store2.get('dogs', 'beagle');
			assert.ok(beagle);
			assert.equal(beagle.data.breed, 'Beagle');

			// Add new data
			store2.set('dogs', 'poodle', {
				id: 'poodle',
				data: { breed: 'Poodle', temperament: ['Intelligent'] },
			});

			// Save again
			await mode.save(store2, tempDir);

			// Third build - verify both entries exist
			const store3 = await mode.load(tempDir);
			assert.equal(store3.values('dogs').length, 2);
			assert.ok(store3.get('dogs', 'beagle'));
			assert.ok(store3.get('dogs', 'poodle'));
		});

		it('clears the store on new build with force flag', async () => {
			const tempDir = createTempDir();

			// First build - create data
			let store1: MutableDataStore;
			if (mode.label) {
				store1 = await mode.load(tempDir);
			} else {
				store1 = new MutableDataStore();
			}
			store1.set('dogs', 'beagle', {
				id: 'beagle',
				data: { breed: 'Beagle' },
			});
			store1.metaStore().set('content-config-digest', 'digest1');

			await mode.save(store1, tempDir);

			// Second build with force flag - should clear
			const store2 = await mode.load(tempDir);

			// Simulate force flag by clearing all
			store2.clearAll();

			// Add different data
			store2.set('cats', 'siamese', {
				id: 'siamese',
				data: { breed: 'Siamese' },
			});

			await mode.save(store2, tempDir);

			// Verify old data is gone, new data exists
			const store3 = await mode.load(tempDir);
			assert.equal(store3.values('dogs').length, 0);
			assert.equal(store3.values('cats').length, 1);
			assert.ok(store3.get('cats', 'siamese'));
		});

		it('clears the store on new build if the content config has changed', async () => {
			const tempDir = createTempDir();

			// First build
			let store1: MutableDataStore;
			if (mode.label) {
				store1 = await mode.load(tempDir);
			} else {
				store1 = new MutableDataStore();
			}
			store1.set('dogs', 'beagle', {
				id: 'beagle',
				data: { breed: 'Beagle' },
			});
			store1.metaStore().set('content-config-digest', 'digest1');

			await mode.save(store1, tempDir);

			// Second build with different config digest
			const store2 = await mode.load(tempDir);
			const previousDigest = store2.metaStore().get('content-config-digest');
			const newDigest = 'digest2';

			if (previousDigest && previousDigest !== newDigest) {
				// Content config changed, clear store
				store2.clearAll();
			}

			store2.metaStore().set('content-config-digest', newDigest);

			// Add new data
			store2.set('cats', 'tabby', {
				id: 'tabby',
				data: { breed: 'Tabby' },
			});

			await mode.save(store2, tempDir);

			// Verify
			const store3 = await mode.load(tempDir);
			assert.equal(store3.values('dogs').length, 0); // Old data cleared
			assert.equal(store3.values('cats').length, 1); // New data exists
			assert.equal(store3.metaStore().get('content-config-digest'), 'digest2');
		});

		it('clears the store on new build if the Astro config has changed', async () => {
			const tempDir = createTempDir();

			// First build
			let store1: MutableDataStore;
			if (mode.label) {
				store1 = await mode.load(tempDir);
			} else {
				store1 = new MutableDataStore();
			}
			store1.set('dogs', 'beagle', {
				id: 'beagle',
				data: { breed: 'Beagle' },
			});
			store1.metaStore().set('astro-config-digest', 'astroDigest1');

			await mode.save(store1, tempDir);

			// Second build with different astro config
			const store2 = await mode.load(tempDir);
			const previousAstroDigest = store2.metaStore().get('astro-config-digest');
			const newAstroDigest = 'astroDigest2';

			if (previousAstroDigest && previousAstroDigest !== newAstroDigest) {
				// Astro config changed, clear store
				store2.clearAll();
			}

			store2.metaStore().set('astro-config-digest', newAstroDigest);

			// Add new data
			store2.set('birds', 'robin', {
				id: 'robin',
				data: { name: 'Robin' },
			});

			await mode.save(store2, tempDir);

			// Verify
			const store3 = await mode.load(tempDir);
			assert.equal(store3.values('dogs').length, 0); // Old data cleared
			assert.equal(store3.values('birds').length, 1); // New data exists
			assert.equal(store3.metaStore().get('astro-config-digest'), 'astroDigest2');
		});

		it('can handle references being renamed after a build', async () => {
			const tempDir = createTempDir();

			// First build - entry with reference
			let store1: MutableDataStore;
			if (mode.label) {
				store1 = await mode.load(tempDir);
			} else {
				store1 = new MutableDataStore();
			}
			store1.set('cats', 'siamese', {
				id: 'siamese',
				data: { breed: 'Siamese' },
			});
			store1.set('posts', 'post1', {
				id: 'post1',
				data: {
					title: 'My Cat',
					cat: { collection: 'cats', id: 'siamese' },
				},
			});

			await mode.save(store1, tempDir);

			// Second build - rename the cat entry
			const store2 = await mode.load(tempDir);

			// Remove old entry
			store2.delete('cats', 'siamese');

			// Add renamed entry
			store2.set('cats', 'siamese-cat', {
				id: 'siamese-cat',
				data: { breed: 'Siamese' },
			});

			// Update the reference
			const post = store2.get('posts', 'post1');
			if (post) {
				post.data.cat = { collection: 'cats', id: 'siamese-cat' };
				store2.set('posts', 'post1', post);
			}

			await mode.save(store2, tempDir);

			// Verify
			const store3 = await mode.load(tempDir);
			assert.ok(!store3.get('cats', 'siamese')); // Old entry gone
			assert.ok(store3.get('cats', 'siamese-cat')); // New entry exists

			const updatedPost: any = store3.get('posts', 'post1');
			assert.equal(updatedPost.data.cat.id, 'siamese-cat'); // Reference updated
		});
	});
}
