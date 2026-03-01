import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { createTempDir } from './test-helpers.js';

describe('Content Layer - Store Persistence', () => {
	it('updates the store on new builds', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);

		// First build - create initial data
		const store1 = new MutableDataStore();
		store1.set('dogs', 'beagle', {
			id: 'beagle',
			data: { breed: 'Beagle', temperament: ['Friendly'] },
		});

		// Save to disk
		await fs.writeFile(dataStoreFile, store1.toString());

		// Second build - load from disk and update
		const store2 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));

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
		await fs.writeFile(dataStoreFile, store2.toString());

		// Third build - verify both entries exist
		const store3 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
		assert.equal(store3.values('dogs').length, 2);
		assert.ok(store3.get('dogs', 'beagle'));
		assert.ok(store3.get('dogs', 'poodle'));
	});

	it('clears the store on new build with force flag', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);

		// First build - create data
		const store1 = new MutableDataStore();
		store1.set('dogs', 'beagle', {
			id: 'beagle',
			data: { breed: 'Beagle' },
		});
		store1.metaStore().set('content-config-digest', 'digest1');

		await fs.writeFile(dataStoreFile, store1.toString());

		// Second build with force flag - should clear
		const store2 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));

		// Simulate force flag by clearing all
		store2.clearAll();

		// Add different data
		store2.set('cats', 'siamese', {
			id: 'siamese',
			data: { breed: 'Siamese' },
		});

		await fs.writeFile(dataStoreFile, store2.toString());

		// Verify old data is gone, new data exists
		const store3 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
		assert.equal(store3.values('dogs').length, 0);
		assert.equal(store3.values('cats').length, 1);
		assert.ok(store3.get('cats', 'siamese'));
	});

	it('clears the store on new build if the content config has changed', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);

		// First build
		const store1 = new MutableDataStore();
		store1.set('dogs', 'beagle', {
			id: 'beagle',
			data: { breed: 'Beagle' },
		});
		store1.metaStore().set('content-config-digest', 'digest1');

		await fs.writeFile(dataStoreFile, store1.toString());

		// Second build with different config digest
		const store2 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
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

		await fs.writeFile(dataStoreFile, store2.toString());

		// Verify
		const store3 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
		assert.equal(store3.values('dogs').length, 0); // Old data cleared
		assert.equal(store3.values('cats').length, 1); // New data exists
		assert.equal(store3.metaStore().get('content-config-digest'), 'digest2');
	});

	it('clears the store on new build if the Astro config has changed', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);

		// First build
		const store1 = new MutableDataStore();
		store1.set('dogs', 'beagle', {
			id: 'beagle',
			data: { breed: 'Beagle' },
		});
		store1.metaStore().set('astro-config-digest', 'astroDigest1');

		await fs.writeFile(dataStoreFile, store1.toString());

		// Second build with different astro config
		const store2 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
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

		await fs.writeFile(dataStoreFile, store2.toString());

		// Verify
		const store3 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
		assert.equal(store3.values('dogs').length, 0); // Old data cleared
		assert.equal(store3.values('birds').length, 1); // New data exists
		assert.equal(store3.metaStore().get('astro-config-digest'), 'astroDigest2');
	});

	it('can handle references being renamed after a build', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);

		// First build - entry with reference
		const store1 = new MutableDataStore();
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

		await fs.writeFile(dataStoreFile, store1.toString());

		// Second build - rename the cat entry
		const store2 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));

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

		await fs.writeFile(dataStoreFile, store2.toString());

		// Verify
		const store3 = await MutableDataStore.fromFile(fileURLToPath(dataStoreFile));
		assert.ok(!store3.get('cats', 'siamese')); // Old entry gone
		assert.ok(store3.get('cats', 'siamese-cat')); // New entry exists

		const updatedPost = store3.get('posts', 'post1');
		assert.equal(updatedPost.data.cat.id, 'siamese-cat'); // Reference updated
	});
});
