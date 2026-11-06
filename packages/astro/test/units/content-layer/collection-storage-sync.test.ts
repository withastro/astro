import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as devalue from 'devalue';
import { z } from 'zod';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { deserializeEntry } from '../../../dist/content/storage.js';
import {
	createDriverLoader,
	readStoredCollectionsManifest,
	writeStoredCollections,
} from '../../../dist/content/storage-sync.js';
import { astroContentVirtualModPlugin } from '../../../dist/content/vite-plugin-content-virtual-mod.js';
import { defaultLogger } from '../test-utils.ts';
import {
	createMemoryStorageDriver,
	createMinimalSettings,
	createTempDir,
	createTestConfigObserver,
} from './test-helpers.ts';

const entries = new Map([
	['docs', [{ id: 'intro', data: { title: 'Intro' }, body: '# Intro' }]],
	['guides', [{ id: 'setup', data: { title: 'Setup' } }]],
	['authors', [{ id: 'alice', data: { name: 'Alice' } }]],
]);

function readStored(driver: ReturnType<typeof createMemoryStorageDriver>, snapshot: string) {
	const collections = driver.snapshots.get(snapshot)!;
	return Object.fromEntries(
		[...collections].map(([name, stored]) => [
			name,
			[...stored.values()].map((entry) => deserializeEntry(entry)),
		]),
	);
}

describe('writeStoredCollections', () => {
	it('writes collections sharing a descriptor to one committed snapshot', async () => {
		const driver = createMemoryStorageDriver();
		const descriptor = { entrypoint: 'memory-driver', config: { name: 'a' } };

		const manifest = await writeStoredCollections({
			collections: new Map([
				['docs', descriptor],
				['guides', { entrypoint: 'memory-driver', config: { name: 'a' } }],
			]),
			readEntries: (name) => entries.get(name)!,
			loadDriver: async () => driver,
		});

		assert.equal(manifest.drivers.length, 1);
		const [{ snapshot, collections, entrypoint, config }] = manifest.drivers;
		assert.deepEqual(collections, ['docs', 'guides']);
		assert.equal(entrypoint, 'memory-driver');
		assert.deepEqual(config, { name: 'a' });
		assert.deepEqual(readStored(driver, snapshot), {
			docs: entries.get('docs'),
			guides: entries.get('guides'),
		});
		const [listed] = await driver.listSnapshots();
		assert.equal(listed.snapshot, snapshot);
		assert.equal(listed.dev, false);
	});

	it('uses a driver and a snapshot per descriptor', async () => {
		const drivers = new Map<string, ReturnType<typeof createMemoryStorageDriver>>();
		const manifest = await writeStoredCollections({
			collections: new Map([
				['docs', { entrypoint: 'memory-driver', config: { name: 'a' } }],
				['authors', { entrypoint: '/project/driver.mjs' }],
			]),
			readEntries: (name) => entries.get(name)!,
			loadDriver: async ({ entrypoint }) => {
				const key = String(entrypoint);
				if (!drivers.has(key)) drivers.set(key, createMemoryStorageDriver());
				return drivers.get(key)!;
			},
		});

		assert.equal(manifest.drivers.length, 2);
		assert.notEqual(manifest.drivers[0].snapshot, manifest.drivers[1].snapshot);
		assert.equal(manifest.drivers[1].entrypoint, '/project/driver.mjs');
		assert.deepEqual(manifest.drivers[1].collections, ['authors']);
	});

	it('uses the snapshot ID created by the driver', async () => {
		const driver = { ...createMemoryStorageDriver(), createSnapshotId: async () => 'deploy-42' };

		const manifest = await writeStoredCollections({
			collections: new Map([['docs', { entrypoint: 'memory-driver' }]]),
			readEntries: (name) => entries.get(name)!,
			loadDriver: async () => driver,
		});

		assert.equal(manifest.drivers[0].snapshot, 'deploy-42');
		assert.ok(driver.snapshots.has('deploy-42'));
	});

	it('generates a new snapshot ID on every write', async () => {
		const driver = createMemoryStorageDriver();
		const write = () =>
			writeStoredCollections({
				collections: new Map([['docs', { entrypoint: 'memory-driver' }]]),
				readEntries: (name) => entries.get(name)!,
				loadDriver: async () => driver,
			});

		const first = await write();
		const second = await write();

		assert.notEqual(first.drivers[0].snapshot, second.drivers[0].snapshot);
	});

	it('throws when the driver creates an empty snapshot ID', async () => {
		const driver = { ...createMemoryStorageDriver(), createSnapshotId: () => '' };

		await assert.rejects(
			writeStoredCollections({
				collections: new Map([['docs', { entrypoint: 'memory-driver' }]]),
				readEntries: (name) => entries.get(name)!,
				loadDriver: async () => driver,
			}),
			{ name: 'InvalidCollectionStorageDriver' },
		);
	});
});

describe('createDriverLoader', () => {
	function writeModule(source: string) {
		const file = new URL('./driver.mjs', createTempDir());
		nodeFs.writeFileSync(file, source);
		return fileURLToPath(file);
	}

	it('creates the driver once per descriptor', async () => {
		const entrypoint = writeModule(`
			export const configs = [];
			export default (config) => {
				configs.push(config);
				return { openWriter: async () => {}, openReader: async () => {} };
			};
		`);
		const loadDriver = createDriverLoader();

		const first = await loadDriver({ entrypoint, config: { name: 'a' } });
		const second = await loadDriver({ entrypoint, config: { name: 'a' } });
		await loadDriver({ entrypoint, config: { name: 'b' } });

		assert.equal(first, second);
		const { configs } = await import(pathToFileURL(entrypoint).href);
		assert.deepEqual(configs, [{ name: 'a' }, { name: 'b' }]);
	});

	it('throws when the entrypoint is invalid', async () => {
		const entrypoints = [
			fileURLToPath(new URL('./missing-driver.mjs', createTempDir())),
			writeModule('export default {};'),
			writeModule('export default () => ({ openWriter: async () => {} });'),
		];
		const loadDriver = createDriverLoader();

		for (const entrypoint of entrypoints) {
			await assert.rejects(loadDriver({ entrypoint }), (error: Error) => {
				assert.equal(error.name, 'InvalidCollectionStorageDriver');
				assert.ok(error.message.includes(entrypoint), error.message);
				return true;
			});
		}
	});
});

describe('ContentLayer with collection storage', () => {
	const logger: any = defaultLogger;

	function createContentLayer(root: URL, collections: Record<string, unknown>, driver: unknown) {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
			loadStorageDriver: async () => driver as any,
		});
		return { contentLayer, store, settings };
	}

	it('writes collections with storage to a snapshot and records it', async () => {
		const root = createTempDir();
		const driver = createMemoryStorageDriver();
		const { contentLayer, store, settings } = createContentLayer(
			root,
			{
				docs: defineCollection({
					loader: () => [{ id: 'intro', title: 'Intro' }],
					schema: z.object({ title: z.string() }),
					storage: { entrypoint: 'memory-driver' },
				}),
				authors: defineCollection({ loader: () => [{ id: 'alice', name: 'Alice' }] }),
			},
			driver,
		);

		await contentLayer.sync();

		const manifest = readStoredCollectionsManifest(nodeFs, settings.dotAstroDir)!;
		assert.equal(manifest.drivers.length, 1);
		assert.deepEqual(manifest.drivers[0].collections, ['docs']);
		const stored = readStored(driver, manifest.drivers[0].snapshot);
		assert.deepEqual(Object.keys(stored), ['docs']);
		assert.equal(stored.docs[0].id, 'intro');
		assert.deepEqual(stored.docs[0].data, { title: 'Intro' });
		// The in-memory store keeps every collection, for loaders and reference validation
		assert.equal(store.values('docs').length, 1);
	});

	it('removes the record when no collection has storage', async () => {
		const root = createTempDir();
		const driver = createMemoryStorageDriver();
		const docs = { loader: () => [{ id: 'intro' }] };

		await createContentLayer(
			root,
			{ docs: defineCollection({ ...docs, storage: { entrypoint: 'memory-driver' } }) },
			driver,
		).contentLayer.sync();
		const { contentLayer, settings } = createContentLayer(
			root,
			{ docs: defineCollection(docs) },
			driver,
		);
		await contentLayer.sync();

		assert.equal(readStoredCollectionsManifest(nodeFs, settings.dotAstroDir), undefined);
	});
});

describe('bundled data store with collection storage', () => {
	async function loadDataStoreModule(root: URL, experimental: Record<string, unknown> = {}) {
		const settings = createMinimalSettings(root, { config: { experimental, legacy: {} } });
		const plugin: any = astroContentVirtualModPlugin({ settings, fs: nodeFs });
		plugin.config?.({}, { command: 'build' });
		const context = {
			error(message: unknown) {
				throw new Error(String(message));
			},
		};
		return plugin.load.handler.call(context, '\0astro:data-layer-content');
	}

	async function writeManifest(root: URL, collections: string[]) {
		const dotAstroDir = new URL('./.astro/', root);
		await nodeFs.promises.mkdir(dotAstroDir, { recursive: true });
		await nodeFs.promises.writeFile(
			new URL('collection-storage.json', dotAstroDir),
			JSON.stringify({
				drivers: [{ entrypoint: 'memory-driver', snapshot: 'abc', collections }],
			}),
		);
	}

	it('leaves stored collections out of a single-file store', async () => {
		const root = createTempDir();
		const store = new Map([
			['docs', new Map([['intro', { id: 'intro', data: {} }]])],
			['authors', new Map([['alice', { id: 'alice', data: {} }]])],
		]);
		const cacheDir = new URL('./.cache/', root);
		await nodeFs.promises.mkdir(cacheDir, { recursive: true });
		await nodeFs.promises.writeFile(new URL('data-store.json', cacheDir), devalue.stringify(store));
		await writeManifest(root, ['docs']);

		const module = await loadDataStoreModule(root);

		const json = module.code.slice('export default JSON.parse('.length, -1);
		const bundled: Map<string, unknown> = devalue.unflatten(JSON.parse(JSON.parse(json)));
		assert.deepEqual([...bundled.keys()], ['authors']);
	});

	it('leaves stored collections out of a chunked store', async () => {
		const root = createTempDir();
		const dataStoreDir = new URL('./.cache/data-store/', root);
		await nodeFs.promises.mkdir(dataStoreDir, { recursive: true });
		await nodeFs.promises.writeFile(
			new URL('manifest.json', dataStoreDir),
			JSON.stringify({ docs: ['0123456789abcdef.txt'], authors: ['fedcba9876543210.txt'] }),
		);
		await writeManifest(root, ['docs']);

		const module = await loadDataStoreModule(root, {
			collectionStorage: { type: 'chunked', chunkSize: 1024 },
		});

		assert.doesNotMatch(module.code, /0123456789abcdef/);
		assert.match(module.code, /fedcba9876543210/);
	});
});
