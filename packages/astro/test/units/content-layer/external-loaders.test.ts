import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { ExternalDataStore } from '../../../dist/content/external-data-store.js';
import { externalFile, externalGlob, file, glob } from '../../../dist/content/loaders/index.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { SpyLogger } from '../test-utils.ts';
import {
	createMarkdownEntryType,
	createMemoryStorageDriver,
	createMinimalSettings,
	createTempDir,
	createTestConfigObserver,
} from './test-helpers.ts';

/** A memory driver that counts `clear()` calls, and whose `set()` fails while `failing` is set */
function createDriver() {
	const driver = createMemoryStorageDriver();
	const state = { clears: 0, failing: false };
	return {
		driver: {
			...driver,
			async set(...args: Parameters<typeof driver.set>) {
				if (state.failing) {
					throw new Error('Database is offline');
				}
				await driver.set(...args);
			},
			async clear(name: string) {
				state.clears++;
				await driver.clear(name);
			},
		},
		get writes() {
			return driver.writes;
		},
		state,
	};
}

function createWatcher() {
	return Object.assign(new EventEmitter(), { add() {} });
}

function sync({
	root,
	collections,
	store = new MutableDataStore(),
	externalStore,
	logger = new SpyLogger(),
	watcher,
	config,
}: {
	root: URL;
	collections: Record<string, any>;
	store?: MutableDataStore;
	externalStore?: ExternalDataStore;
	logger?: SpyLogger;
	watcher?: ReturnType<typeof createWatcher>;
	config?: Record<string, unknown>;
}) {
	const contentLayer = new ContentLayer({
		settings: createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
			config,
		}),
		logger,
		store,
		externalStore,
		watcher: watcher as any,
		contentConfigObserver: createTestConfigObserver(collections),
	});
	return { contentLayer, done: contentLayer.sync() };
}

/** Writes the given files in a new project, and returns its root */
function createProject(files: Record<string, string>) {
	const root = createTempDir();
	for (const [path, contents] of Object.entries(files)) {
		const url = new URL(path, root);
		mkdirSync(new URL('./', url), { recursive: true });
		writeFileSync(url, contents);
	}
	return root;
}

async function waitFor(condition: () => Promise<boolean>) {
	for (let i = 0; i < 50; i++) {
		if (await condition()) {
			return;
		}
		await delay(20);
	}
	assert.fail('The condition was never met');
}

const post = (title: string, slug?: string) =>
	`---\ntitle: ${title}\n${slug ? `slug: ${slug}\n` : ''}---\n${title} body`;

describe('externalGlob()', () => {
	it('saves the same entries as glob()', async () => {
		const root = new URL('../../fixtures/content-layer/', import.meta.url);
		const options = { pattern: '*.md', base: 'src/content/space' };
		const store = new MutableDataStore();
		await sync({ root, store, collections: { space: defineCollection({ loader: glob(options) }) } })
			.done;
		const externalStore = new ExternalDataStore(createMemoryStorageDriver());
		await sync({
			root,
			externalStore,
			collections: {
				space: defineCollection({ storage: 'external', loader: externalGlob(options) }),
			},
		}).done;

		const external = externalStore.scopedStore('space');
		assert.deepEqual((await external.keys()).sort(), store.keys('space').sort());
		for (const id of store.keys('space')) {
			assert.deepEqual(await external.get(id), store.get('space', id));
		}
	});

	it('saves only the files that changed since the previous sync', async () => {
		const root = createProject({
			'posts/a.md': post('A'),
			'posts/b.md': post('B'),
			'posts/c.md': post('C'),
		});
		const counts = createDriver();
		const { driver, state } = counts;
		const externalStore = new ExternalDataStore(driver);
		const collections = {
			posts: defineCollection({
				storage: 'external',
				loader: externalGlob({ pattern: '*.md', base: 'posts' }),
			}),
		};
		await sync({ root, externalStore, collections }).done;
		assert.equal(counts.writes, 3);

		writeFileSync(new URL('posts/b.md', root), post('B2'));
		rmSync(new URL('posts/c.md', root));
		writeFileSync(new URL('posts/d.md', root), post('D'));
		await sync({ root, externalStore, collections }).done;

		const posts = externalStore.scopedStore('posts');
		assert.equal(counts.writes, 5);
		assert.deepEqual((await posts.keys()).sort(), ['a', 'b', 'd']);
		assert.equal((await posts.get('b'))?.data.title, 'B2');
		assert.equal(state.clears, 0);
	});

	it('saves the IDs returned by generateId as strings', async () => {
		const root = createProject({ 'posts/a.md': post('A') });
		const counts = createDriver();
		const { driver } = counts;
		const externalStore = new ExternalDataStore(driver);
		const collections = {
			posts: defineCollection({
				storage: 'external',
				loader: externalGlob({ pattern: '*.md', base: 'posts', generateId: () => 1 as any }),
			}),
		};

		await sync({ root, externalStore, collections }).done;
		await sync({ root, externalStore, collections }).done;

		assert.deepEqual(await externalStore.scopedStore('posts').keys(), ['1']);
		assert.equal(counts.writes, 1);
	});

	it('throws on duplicate IDs when prerenderConflictBehavior is error', async () => {
		const root = createProject({
			'posts/a.md': post('A', 'same'),
			'posts/b.md': post('B', 'same'),
		});
		const { done } = sync({
			root,
			config: { prerenderConflictBehavior: 'error' },
			externalStore: new ExternalDataStore(createMemoryStorageDriver()),
			collections: {
				posts: defineCollection({
					storage: 'external',
					loader: externalGlob({ pattern: '*.md', base: 'posts' }),
				}),
			},
		});
		await assert.rejects(done, { name: 'DuplicateContentEntrySlugError' });
	});

	it('updates entries when the watcher reports changes, and logs driver errors', async () => {
		const root = createProject({ 'posts/a.md': post('A'), 'posts/b.md': post('B') });
		const { driver, state } = createDriver();
		const externalStore = new ExternalDataStore(driver);
		const posts = externalStore.scopedStore('posts');
		const watcher = createWatcher();
		const logger = new SpyLogger();
		const { contentLayer, done } = sync({
			root,
			externalStore,
			watcher,
			logger,
			collections: {
				posts: defineCollection({
					storage: 'external',
					loader: externalGlob({ pattern: '*.md', base: 'posts' }),
				}),
			},
		});
		await done;

		writeFileSync(new URL('posts/a.md', root), post('A2'));
		watcher.emit('change', fileURLToPath(new URL('posts/a.md', root)));
		await waitFor(async () => (await posts.get('a'))?.data.title === 'A2');

		rmSync(new URL('posts/b.md', root));
		watcher.emit('unlink', fileURLToPath(new URL('posts/b.md', root)));
		await waitFor(async () => !(await posts.has('b')));

		state.failing = true;
		writeFileSync(new URL('posts/a.md', root), post('A3'));
		watcher.emit('change', fileURLToPath(new URL('posts/a.md', root)));
		await waitFor(async () =>
			logger.logs.some((log) => log.message.includes('Failed to reload a.md: Database is offline')),
		);
		contentLayer.dispose();
	});

	it('throws when the collection does not use external storage', async () => {
		const { done } = sync({
			root: createProject({}),
			collections: { posts: defineCollection({ loader: externalGlob({ pattern: '*.md' }) }) },
		});
		await assert.rejects(done, { name: 'ContentLoaderRequiresExternalStorage' });
	});

	it('does not pass its external storage support to a loader that spreads it', () => {
		const loader = externalGlob({ pattern: '*.md' });
		assert.equal(loader.supportsExternalStorage, true);
		assert.equal({ ...loader }.supportsExternalStorage, undefined);
	});
});

describe('externalFile()', () => {
	const items = (...list: Array<{ id: string; name: string }>) => JSON.stringify(list);

	it('saves entries with the same IDs and data as file()', async () => {
		const root = createProject({
			'array.json': items({ id: 'a', name: 'A' }, { id: 'b', name: 'B' }),
			'object.json': JSON.stringify({ $schema: './schema.json', c: { name: 'C' } }),
		});
		const store = new MutableDataStore();
		await sync({
			root,
			store,
			collections: {
				array: defineCollection({ loader: file('array.json') }),
				object: defineCollection({ loader: file('object.json') }),
			},
		}).done;
		const externalStore = new ExternalDataStore(createMemoryStorageDriver());
		await sync({
			root,
			externalStore,
			collections: {
				array: defineCollection({ storage: 'external', loader: externalFile('array.json') }),
				object: defineCollection({ storage: 'external', loader: externalFile('object.json') }),
			},
		}).done;

		for (const collection of ['array', 'object']) {
			const external = externalStore.scopedStore(collection);
			assert.deepEqual((await external.keys()).sort(), store.keys(collection).sort());
			for (const id of store.keys(collection)) {
				const { digest: _digest, ...entry } = (await external.get(id))!;
				assert.deepEqual(entry, store.get(collection, id));
			}
		}
	});

	it('saves only the items that changed, and removes the items removed from the file', async () => {
		const root = createProject({
			'data.json': items({ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }),
		});
		const counts = createDriver();
		const { driver, state } = counts;
		const externalStore = new ExternalDataStore(driver);
		const collections = {
			data: defineCollection({ storage: 'external', loader: externalFile('data.json') }),
		};
		await sync({ root, externalStore, collections }).done;
		assert.equal(counts.writes, 3);

		writeFileSync(
			new URL('data.json', root),
			items({ id: 'a', name: 'A' }, { id: 'b', name: 'B2' }, { id: 'd', name: 'D' }),
		);
		await sync({ root, externalStore, collections }).done;

		const data = externalStore.scopedStore('data');
		assert.equal(counts.writes, 5);
		assert.deepEqual((await data.keys()).sort(), ['a', 'b', 'd']);
		assert.equal((await data.get('b'))?.data.name, 'B2');
		assert.equal(state.clears, 0);
	});

	it('keeps the saved entries when the file cannot be parsed', async () => {
		const root = createProject({ 'data.json': items({ id: 'a', name: 'A' }) });
		const externalStore = new ExternalDataStore(createMemoryStorageDriver());
		const collections = {
			data: defineCollection({ storage: 'external', loader: externalFile('data.json') }),
		};
		await sync({ root, externalStore, collections }).done;

		writeFileSync(new URL('data.json', root), '[{ invalid');
		await sync({ root, externalStore, collections }).done;

		assert.deepEqual(await externalStore.scopedStore('data').keys(), ['a']);
	});

	it('updates entries when the watcher reports changes, and logs driver errors', async () => {
		const root = createProject({ 'data.json': items({ id: 'a', name: 'A' }) });
		const { driver, state } = createDriver();
		const externalStore = new ExternalDataStore(driver);
		const data = externalStore.scopedStore('data');
		const watcher = createWatcher();
		const logger = new SpyLogger();
		const { contentLayer, done } = sync({
			root,
			externalStore,
			watcher,
			logger,
			collections: {
				data: defineCollection({ storage: 'external', loader: externalFile('data.json') }),
			},
		});
		await done;
		const filePath = fileURLToPath(new URL('data.json', root));

		writeFileSync(filePath, items({ id: 'a', name: 'A2' }));
		watcher.emit('change', filePath);
		await waitFor(async () => (await data.get('a'))?.data.name === 'A2');

		state.failing = true;
		writeFileSync(filePath, items({ id: 'a', name: 'A3' }));
		watcher.emit('change', filePath);
		await waitFor(async () =>
			logger.logs.some((log) =>
				log.message.includes('Failed to reload data.json: Database is offline'),
			),
		);
		contentLayer.dispose();
	});

	it('throws when the collection does not use external storage', async () => {
		const { done } = sync({
			root: createProject({ 'data.json': '[]' }),
			collections: { data: defineCollection({ loader: externalFile('data.json') }) },
		});
		await assert.rejects(done, { name: 'ContentLoaderRequiresExternalStorage' });
	});
});
