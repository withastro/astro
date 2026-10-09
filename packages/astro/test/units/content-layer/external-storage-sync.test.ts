import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import {
	createExternalDataStore,
	ExternalDataStore,
} from '../../../dist/content/external-data-store.js';
import { isExternalLoaderContext } from '../../../dist/content/loaders/index.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { SpyLogger } from '../test-utils.ts';
import {
	createMemoryStorageDriver,
	createMinimalSettings,
	createTempDir,
	createTestConfigObserver,
} from './test-helpers.ts';

/** A memory driver that also counts the calls to `clear()`, `flush()` and `close()` */
function createDriver() {
	const driver = createMemoryStorageDriver();
	const calls = { clear: 0, flush: 0, close: 0 };
	return {
		driver: {
			...driver,
			async clear(name: string) {
				calls.clear++;
				await driver.clear(name);
			},
			async flush() {
				calls.flush++;
			},
			async close() {
				calls.close++;
			},
		},
		entries: driver.entries,
		meta: driver.meta,
		calls,
	};
}

function createLayer({
	collections,
	externalStore,
	store = new MutableDataStore(),
	logger = new SpyLogger(),
	force,
	observer = createTestConfigObserver(collections),
}: {
	collections: Record<string, any>;
	externalStore?: ExternalDataStore;
	store?: MutableDataStore;
	logger?: SpyLogger;
	force?: boolean;
	observer?: any;
}) {
	const settings = createMinimalSettings(createTempDir());
	const contentLayer = new ContentLayer({
		settings,
		logger,
		store,
		externalStore,
		force,
		contentConfigObserver: observer,
	});
	return { contentLayer, settings, store, logger };
}

/** A loader that supports external storage and saves the given entries */
function createExternalLoader(
	entries: Array<Record<string, any>>,
	onLoad?: (context: any) => void | Promise<void>,
) {
	return {
		name: 'external-loader',
		supportsExternalStorage: true,
		load: async (context: any) => {
			await onLoad?.(context);
			for (const entry of entries) {
				await context.store.set(entry);
			}
		},
	};
}

describe('Content layer with external storage', () => {
	it('throws when a collection uses external storage without a driver', async () => {
		const { contentLayer } = createLayer({
			collections: {
				posts: defineCollection({ storage: 'external', loader: () => [] }),
			},
		});
		await assert.rejects(contentLayer.sync(), { name: 'ContentStorageDriverMissing' });
	});

	it('throws when the loader of an external collection does not support it', async () => {
		const { driver } = createDriver();
		const { contentLayer } = createLayer({
			externalStore: new ExternalDataStore(driver),
			collections: {
				posts: defineCollection({
					storage: 'external',
					loader: { name: 'embedded-only', load: async () => {} },
				}),
			},
		});
		await assert.rejects(contentLayer.sync(), {
			name: 'ContentLoaderExternalStorageUnsupported',
		});
	});

	it('gives external collections a context backed by the driver', async () => {
		const { driver, entries, meta, calls } = createDriver();
		let isExternal: boolean | undefined;
		const { contentLayer, store } = createLayer({
			externalStore: new ExternalDataStore(driver),
			collections: {
				posts: defineCollection({
					storage: 'external',
					loader: createExternalLoader([{ id: 'hello', data: { title: 'Hello' } }], (context) => {
						isExternal = isExternalLoaderContext(context);
						return context.meta.set('last-sync', 'now');
					}),
				}),
				authors: defineCollection({ loader: () => [{ id: 'ada' }] }),
			},
		});

		await contentLayer.sync();

		assert.equal(isExternal, true);
		assert.deepEqual([...entries.get('posts')!.keys()], ['hello']);
		assert.equal(meta.get('posts')?.get('last-sync'), 'now');
		assert.deepEqual(store.keys('posts'), []);
		assert.deepEqual(store.keys('authors'), ['ada']);
		assert.equal(entries.has('authors'), false);
		assert.equal(calls.flush, 1);
	});

	it('updates external collections of inline loaders without clearing them', async () => {
		const { driver, entries, calls } = createDriver();
		const externalStore = new ExternalDataStore(driver);
		let items = [
			{ id: 'a', title: 'A' },
			{ id: 'b', title: 'B' },
		];
		const collections = {
			posts: defineCollection({ storage: 'external', loader: () => items }),
		};

		await createLayer({ collections, externalStore }).contentLayer.sync();
		assert.deepEqual([...entries.get('posts')!.keys()], ['a', 'b']);

		items = [
			{ id: 'b', title: 'B2' },
			{ id: 'c', title: 'C' },
		];
		await createLayer({ collections, externalStore }).contentLayer.sync();

		const posts = new ExternalDataStore(driver).scopedStore('posts');
		assert.deepEqual((await posts.keys()).sort(), ['b', 'c']);
		assert.equal((await posts.get('b'))?.data.title, 'B2');
		assert.equal(calls.clear, 0);
	});

	it('clears external collections and their meta when the content config changes', async () => {
		const { driver, calls } = createDriver();
		const externalStore = new ExternalDataStore(driver);
		const seenAtLoad: Array<[Array<string>, string | undefined]> = [];
		const collections = {
			posts: defineCollection({
				storage: 'external',
				loader: createExternalLoader([{ id: 'hello', data: {} }], async (context) => {
					seenAtLoad.push([await context.store.keys(), await context.meta.get('cursor')]);
					await context.meta.set('cursor', String(seenAtLoad.length));
				}),
			}),
		};
		const observer = createTestConfigObserver(collections);

		await createLayer({ collections, externalStore, observer }).contentLayer.sync();
		await createLayer({ collections, externalStore, observer }).contentLayer.sync();
		observer.get().config.digest = 'changed-digest';
		await createLayer({ collections, externalStore, observer }).contentLayer.sync();

		assert.deepEqual(seenAtLoad, [
			[[], undefined],
			[['hello'], '1'],
			[[], undefined],
		]);
		assert.equal(calls.clear, 1);
	});

	it('clears external collections in the first sync when forced', async () => {
		const { driver, calls } = createDriver();
		const externalStore = new ExternalDataStore(driver);
		const collections = {
			posts: defineCollection({
				storage: 'external',
				loader: createExternalLoader([{ id: 'hello', data: {} }]),
			}),
		};
		await createLayer({ collections, externalStore }).contentLayer.sync();
		assert.equal(calls.clear, 0);

		const { contentLayer } = createLayer({ collections, externalStore, force: true });
		await contentLayer.sync();
		assert.equal(calls.clear, 1);
		await contentLayer.sync();
		assert.equal(calls.clear, 1);
	});

	it('validates references between embedded and external collections', async () => {
		const { driver } = createDriver();
		const logger = new SpyLogger();
		const { contentLayer } = createLayer({
			logger,
			externalStore: new ExternalDataStore(driver),
			collections: {
				authors: defineCollection({
					storage: 'external',
					loader: createExternalLoader([
						{ id: 'ada', data: { friend: { collection: 'posts', id: 'missing-post' } } },
					]),
				}),
				posts: defineCollection({
					loader: () => [
						{ id: 'hello', author: { collection: 'authors', id: 'ada' } },
						{ id: 'bye', author: { collection: 'authors', id: 'grace' } },
					],
				}),
			},
		});

		await contentLayer.sync();

		const errors = logger.logs
			.filter((log) => log.level === 'error')
			.map((log) => log.message)
			.sort();
		assert.equal(errors.length, 2);
		assert.match(errors[0], /entry "ada" in collection "authors".*"missing-post"/);
		assert.match(errors[1], /entry "bye" in collection "posts".*"grace"/);
	});

	it('writes the imports of external entries to the import files', async () => {
		const { driver } = createDriver();
		const { contentLayer, settings } = createLayer({
			externalStore: new ExternalDataStore(driver),
			collections: {
				posts: defineCollection({
					storage: 'external',
					loader: createExternalLoader([
						{
							id: 'hello',
							data: {},
							assetImports: ['./cover.png'],
							filePath: 'src/posts/hello.md',
							deferredRender: true,
						},
					]),
				}),
			},
		});

		await contentLayer.sync();

		const assets = await readFile(new URL('content-assets.mjs', settings.dotAstroDir), 'utf-8');
		const modules = await readFile(new URL('content-modules.mjs', settings.dotAstroDir), 'utf-8');
		assert.match(assets, /cover\.png/);
		assert.ok(modules.includes(JSON.stringify('src/posts/hello.md')));
	});

	it('saves the writes that loaders make after a sync', async () => {
		const { driver, calls } = createDriver();
		const externalStore = new ExternalDataStore(driver);
		let flushed = 0;
		externalStore.onFlush(() => flushed++);
		let posts: any;
		const { contentLayer, settings } = createLayer({
			externalStore,
			collections: {
				posts: defineCollection({
					storage: 'external',
					loader: createExternalLoader([], (context) => {
						posts = context.store;
					}),
				}),
			},
		});
		await contentLayer.sync();
		assert.equal(calls.flush, 1);
		assert.equal(flushed, 0);

		await posts.set({ id: 'later', data: {}, assetImports: ['./later.png'] });
		for (let i = 0; i < 40 && calls.flush < 2; i++) {
			await delay(50);
		}

		assert.equal(calls.flush, 2);
		assert.equal(flushed, 1);
		const assets = await readFile(new URL('content-assets.mjs', settings.dotAstroDir), 'utf-8');
		assert.match(assets, /later\.png/);
		contentLayer.dispose();
	});

	it('closes the external store when disposed', async () => {
		const { driver, calls } = createDriver();
		const { contentLayer } = createLayer({
			externalStore: new ExternalDataStore(driver),
			collections: {},
		});
		contentLayer.dispose();
		await delay(0);
		assert.equal(calls.close, 1);
	});
});

describe('createExternalDataStore', () => {
	function createSettings(collectionStorage: unknown) {
		return createMinimalSettings(createTempDir(), {
			config: { experimental: { collectionStorage } },
		});
	}

	function createEnvironment(load: (specifier: string) => Promise<unknown>) {
		return { runner: { import: load } } as any;
	}

	it('returns undefined when no driver is configured', async () => {
		const environment = createEnvironment(async () => assert.fail('should not import'));
		assert.equal(await createExternalDataStore(createSettings(undefined), environment), undefined);
		assert.equal(
			await createExternalDataStore(createSettings({ type: 'external' }), environment),
			undefined,
		);
	});

	it('creates the driver with its config', async () => {
		let received: unknown;
		const settings = createSettings({
			type: 'external',
			driver: { entrypoint: 'my-driver', config: { url: 'file:test.db' } },
		});
		const environment = createEnvironment(async (specifier) => {
			assert.equal(specifier, 'my-driver');
			return {
				default: (config: unknown) => {
					received = config;
					return createMemoryStorageDriver();
				},
			};
		});

		const store = await createExternalDataStore(settings, environment);

		assert.ok(store instanceof ExternalDataStore);
		assert.deepEqual(received, { url: 'file:test.db' });
	});

	it('throws when the driver cannot be loaded', async () => {
		const settings = createSettings({ type: 'external', driver: { entrypoint: 'missing' } });
		await assert.rejects(
			createExternalDataStore(
				settings,
				createEnvironment(async () => {
					throw new Error('Cannot find module');
				}),
			),
			{ name: 'ContentStorageDriverNotFound' },
		);
		await assert.rejects(
			createExternalDataStore(
				settings,
				createEnvironment(async () => ({ default: 'not a function' })),
			),
			{ name: 'ContentStorageDriverNotFound' },
		);
	});
});
