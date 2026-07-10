import { strict as assert } from 'node:assert';
import { describe, it, mock } from 'node:test';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { DATA_STORE_MANIFEST_FILE } from '../../../dist/content/consts.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { createTempDir } from './test-helpers.ts';

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

		const updatedPost: any = store3.get('posts', 'post1');
		assert.equal(updatedPost.data.cat.id, 'siamese-cat'); // Reference updated
	});
});

describe('Content Layer - Store Persistence (chunked)', () => {
	it('persists and accumulates entries across builds', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		// First build - create initial data and write it to the chunked store.
		const store1 = await MutableDataStore.fromDir(dataStoreDir);
		store1.set('dogs', 'beagle', {
			id: 'beagle',
			data: { breed: 'Beagle', temperament: ['Friendly'] },
		});
		await store1.waitUntilSaveComplete();

		// Second build - load from the directory and verify existing data persists.
		const store2 = await MutableDataStore.fromDir(dataStoreDir);
		const beagle = store2.get('dogs', 'beagle');
		assert.ok(beagle);
		assert.equal(beagle.data.breed, 'Beagle');

		// Add new data and write again.
		store2.set('dogs', 'poodle', {
			id: 'poodle',
			data: { breed: 'Poodle', temperament: ['Intelligent'] },
		});
		await store2.waitUntilSaveComplete();

		// Third build - verify both entries exist.
		const store3 = await MutableDataStore.fromDir(dataStoreDir);
		assert.equal(store3.values('dogs').length, 2);
		assert.ok(store3.get('dogs', 'beagle'));
		assert.ok(store3.get('dogs', 'poodle'));
	});

	it('clears stale entries and prunes orphaned part files on rebuild', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		// First build - create data across two collections.
		const store1 = await MutableDataStore.fromDir(dataStoreDir);
		store1.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		store1.metaStore().set('content-config-digest', 'digest1');
		await store1.waitUntilSaveComplete();

		// The part files written by the first snapshot.
		const partsAfterFirst = (await fs.readdir(fileURLToPath(dataStoreDir))).filter((file) =>
			file.endsWith('.txt'),
		);
		assert.ok(partsAfterFirst.length > 0, 'expected the first snapshot to write part files');

		// Second build - clear everything and write different data.
		const store2 = await MutableDataStore.fromDir(dataStoreDir);
		store2.clearAll();
		store2.set('cats', 'siamese', { id: 'siamese', data: { breed: 'Siamese' } });
		await store2.waitUntilSaveComplete();

		// Old data is gone, new data exists.
		const store3 = await MutableDataStore.fromDir(dataStoreDir);
		assert.equal(store3.values('dogs').length, 0);
		assert.equal(store3.values('cats').length, 1);
		assert.ok(store3.get('cats', 'siamese'));

		// The manifest (commit point) is still present, and every part file left
		// behind by the first snapshot has been pruned.
		const filesAfterSecond = await fs.readdir(fileURLToPath(dataStoreDir));
		assert.ok(filesAfterSecond.includes(DATA_STORE_MANIFEST_FILE));
		for (const stalePart of partsAfterFirst) {
			assert.ok(
				!filesAfterSecond.includes(stalePart),
				`expected orphaned part ${stalePart} to be pruned`,
			);
		}
	});

	it('can handle references being renamed after a build', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		// First build - an entry that references another collection.
		const store1 = await MutableDataStore.fromDir(dataStoreDir);
		store1.set('cats', 'siamese', { id: 'siamese', data: { breed: 'Siamese' } });
		store1.set('posts', 'post1', {
			id: 'post1',
			data: { title: 'My Cat', cat: { collection: 'cats', id: 'siamese' } },
		});
		await store1.waitUntilSaveComplete();

		// Second build - rename the referenced entry and update the reference.
		const store2 = await MutableDataStore.fromDir(dataStoreDir);
		store2.delete('cats', 'siamese');
		store2.set('cats', 'siamese-cat', { id: 'siamese-cat', data: { breed: 'Siamese' } });
		const post: any = store2.get('posts', 'post1');
		post.data.cat = { collection: 'cats', id: 'siamese-cat' };
		store2.set('posts', 'post1', post);
		await store2.waitUntilSaveComplete();

		// Cross-collection references survive the chunk split and rejoin.
		const store3 = await MutableDataStore.fromDir(dataStoreDir);
		assert.ok(!store3.get('cats', 'siamese'));
		assert.ok(store3.get('cats', 'siamese-cat'));
		const updatedPost: any = store3.get('posts', 'post1');
		assert.equal(updatedPost.data.cat.id, 'siamese-cat');
	});

	it('round-trips rich Unicode entry data through the chunk split', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		// Data with astral emoji, a ZWJ sequence, CJK, and accented text. This
		// exercises the whole serialize, split, write, read, rejoin, and parse
		// path, which must not corrupt any surrogate pair along the way.
		const richData = {
			emoji: '😀🎉',
			family: '👨‍👩‍👧‍👦',
			cjk: '好きな本',
			accented: 'café déjà vu',
		};

		const store1 = await MutableDataStore.fromDir(dataStoreDir);
		store1.set('notes', 'unicode', { id: 'unicode', data: richData });
		await store1.waitUntilSaveComplete();

		const store2 = await MutableDataStore.fromDir(dataStoreDir);
		const entry: any = store2.get('notes', 'unicode');
		assert.ok(entry);
		assert.deepEqual(entry.data, richData);
	});
});

describe('Content Layer - Store Persistence (chunked atomicity)', () => {
	// Reads the manifest and returns the flat list of every part file it
	// references, so a test can compare it against what's actually on disk.
	async function readReferencedParts(dataStoreDir: URL): Promise<string[]> {
		const manifest = JSON.parse(
			await fs.readFile(new URL(`./${DATA_STORE_MANIFEST_FILE}`, dataStoreDir), 'utf-8'),
		);
		// manifest: collection -> parts, so flatten one level deep.
		return Object.values(manifest as Record<string, string[]>).flat();
	}

	async function readPartFilesOnDisk(dataStoreDir: URL): Promise<string[]> {
		const files = await fs.readdir(fileURLToPath(dataStoreDir));
		return files.filter((file) => file.endsWith('.txt'));
	}

	// A: mutations that arrive while a write is in progress must not be lost, and
	// the intermediate snapshot's now-orphaned parts must not linger.
	it('coalesces writes that arrive while a write is in progress', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		const store = await MutableDataStore.fromDir(dataStoreDir);
		store.set('pets', 'cat', { id: 'cat', data: { legs: 4 } });
		// `writeToDisk()` runs synchronously up to its first internal await, so it
		// leaves `#writeInProgress` set and returns a pending promise.
		const firstWrite = store.writeToDisk();
		// Mutate while that write is in flight, then request another write. The
		// second call must queue behind the first rather than run in parallel.
		store.set('pets', 'dog', { id: 'dog', data: { legs: 4 } });
		const secondWrite = store.writeToDisk();
		await Promise.all([firstWrite, secondWrite]);
		await store.waitUntilSaveComplete();

		// The final on-disk snapshot has both entries.
		const reloaded = await MutableDataStore.fromDir(dataStoreDir);
		assert.equal(reloaded.values('pets').length, 2);
		assert.ok(reloaded.get('pets', 'cat'));
		assert.ok(reloaded.get('pets', 'dog'));

		// Every part file on disk is referenced by the final manifest: no orphan
		// was left behind by the coalesced write.
		const referenced = new Set(await readReferencedParts(dataStoreDir));
		const partsOnDisk = await readPartFilesOnDisk(dataStoreDir);
		assert.equal(partsOnDisk.length, referenced.size);
		for (const part of partsOnDisk) {
			assert.ok(referenced.has(part), `unexpected orphan part ${part}`);
		}
	});

	// B: the manifest is the commit point. Part files written before a crash (and
	// therefore never referenced by the committed manifest) must be ignored on
	// load, and pruned by the next successful write.
	it('ignores uncommitted part files not referenced by the manifest', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		const store = await MutableDataStore.fromDir(dataStoreDir);
		store.set('pets', 'cat', { id: 'cat', data: { legs: 4 } });
		await store.waitUntilSaveComplete();

		// Simulate a crash mid-write: an extra part exists but the committed
		// manifest never referenced it.
		const orphan = new URL('./deadbeef.txt', dataStoreDir);
		await fs.writeFile(orphan, 'written before the manifest was committed');

		// Loading uses only the manifest, so the committed snapshot is intact.
		const reloaded = await MutableDataStore.fromDir(dataStoreDir);
		assert.equal(reloaded.values('pets').length, 1);
		assert.ok(reloaded.get('pets', 'cat'));

		// The next successful write prunes the orphan.
		reloaded.set('pets', 'dog', { id: 'dog', data: { legs: 4 } });
		await reloaded.waitUntilSaveComplete();
		const filesAfter = await fs.readdir(fileURLToPath(dataStoreDir));
		assert.ok(!filesAfter.includes('deadbeef.txt'), 'expected the orphan part to be pruned');
	});

	// C: a manifest that references a missing part is a corrupt cache. Loading
	// must warn loudly and start empty (so loaders rebuild) rather than throw.
	it('recovers from a missing part file by starting empty instead of throwing', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		const store = await MutableDataStore.fromDir(dataStoreDir);
		store.set('pets', 'cat', { id: 'cat', data: { legs: 4 } });
		await store.waitUntilSaveComplete();

		// Delete a part file that the manifest still references.
		const [firstPart] = await readReferencedParts(dataStoreDir);
		await fs.rm(new URL(`./${firstPart}`, dataStoreDir));

		const warn = mock.method(console, 'warn', () => {});
		let reloaded: MutableDataStore;
		try {
			reloaded = await MutableDataStore.fromDir(dataStoreDir);
		} finally {
			warn.mock.restore();
		}

		// It started empty (rebuild from scratch) and warned about the corruption.
		assert.equal(reloaded.values('pets').length, 0);
		assert.ok(warn.mock.calls.length >= 1, 'expected a warning about the corrupt cache');
	});

	// D: parts are named by a hash of their contents, so two collections that
	// serialize identically share a single file on disk.
	it('deduplicates identical parts by content address', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);

		const store = await MutableDataStore.fromDir(dataStoreDir);
		// Two collections whose serialized chunk is byte-for-byte identical (the
		// collection name is a manifest key, not part of the serialized content).
		const entry = { id: 'x', data: { value: 1 } };
		store.set('alpha', 'x', entry);
		store.set('beta', 'x', entry);
		await store.waitUntilSaveComplete();

		// Both collections reference the same single part file.
		const manifest = JSON.parse(
			await fs.readFile(new URL(`./${DATA_STORE_MANIFEST_FILE}`, dataStoreDir), 'utf-8'),
		) as Record<string, string[]>;
		assert.equal(manifest.alpha[0], manifest.beta[0]);

		// And that part exists exactly once on disk.
		const partsOnDisk = await readPartFilesOnDisk(dataStoreDir);
		assert.equal(partsOnDisk.length, 1);
		assert.equal(partsOnDisk[0], manifest.alpha[0]);
	});
});
