import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { DATA_STORE_MANIFEST_FILE } from '../../../dist/content/consts.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { createTempDir } from './test-helpers.ts';
import { SpyLogger } from '../test-utils.ts';

const CHUNK_SIZE = 1024 * 1024;

// The dev server subscribes to these notifications to invalidate the content
// virtual modules deterministically after each write, because the file watcher
// can miss the atomic rename that commits a write on some platforms (notably
// Windows, see #17335).
describe('MutableDataStore - write notifications', () => {
	it('notifies with the store file path after a write', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);
		const store = await MutableDataStore.fromFile(dataStoreFile);

		const written: string[] = [];
		store.onFileWritten((path) => written.push(path));

		store.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		await store.waitUntilSaveComplete();

		assert.deepEqual(written, [fileURLToPath(dataStoreFile)]);
	});

	it('does not notify when the data on disk is already identical', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);
		const store = await MutableDataStore.fromFile(dataStoreFile);

		store.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		await store.waitUntilSaveComplete();

		const written: string[] = [];
		store.onFileWritten((path) => written.push(path));

		// Force another save cycle without changing the serialized data. The
		// writer skips the identical write, so no notification is emitted and
		// the dev server does not reload the page for a no-op sync.
		store.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		await store.waitUntilSaveComplete();

		assert.deepEqual(written, []);
	});

	it('notifies with the manifest path for chunked stores', async () => {
		const tempDir = createTempDir();
		const dataStoreDir = new URL('./data-store/', tempDir);
		const logger = new SpyLogger();
		const store = await MutableDataStore.fromDir(dataStoreDir, CHUNK_SIZE, logger);

		const written: string[] = [];
		store.onFileWritten((path) => written.push(path));

		store.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		await store.waitUntilSaveComplete();

		assert.deepEqual(written, [
			fileURLToPath(new URL(`./${DATA_STORE_MANIFEST_FILE}`, dataStoreDir)),
		]);
	});

	it('notifies for asset import file writes', async () => {
		const tempDir = createTempDir();
		const assetsFile = new URL('./content-assets.mjs', tempDir);
		const store = new MutableDataStore();

		const written: string[] = [];
		store.onFileWritten((path) => written.push(path));

		store.scopedStore('categories').set({
			id: 'example',
			data: {},
			filePath: 'src/content/categories/example.json',
			assetImports: ['./images/seed.webp'],
		});
		await store.writeAssetImports(assetsFile);

		assert.deepEqual(written, [fileURLToPath(assetsFile)]);
	});

	it('stops notifying after the listener is removed', async () => {
		const tempDir = createTempDir();
		const dataStoreFile = new URL('./data-store.json', tempDir);
		const store = await MutableDataStore.fromFile(dataStoreFile);

		const written: string[] = [];
		const unsubscribe = store.onFileWritten((path) => written.push(path));

		store.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		await store.waitUntilSaveComplete();
		assert.equal(written.length, 1);

		unsubscribe();
		store.set('dogs', 'poodle', { id: 'poodle', data: { breed: 'Poodle' } });
		await store.waitUntilSaveComplete();
		assert.equal(written.length, 1);
	});
});
