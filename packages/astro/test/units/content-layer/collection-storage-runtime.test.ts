import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ImmutableDataStore } from '../../../dist/content/data-store.js';
import { CompositeSource, InMemorySource } from '../../../dist/content/data-store-source.js';
import { serializeEntry } from '../../../dist/content/storage.js';
import { StoredCollectionsSource } from '../../../dist/content/storage-runtime.js';
import { generateCollectionStorageModule } from '../../../dist/content/vite-plugin-content-virtual-mod.js';
import { createMemoryStorageDriver } from './test-helpers.ts';

const intro = {
	id: 'intro',
	data: { title: 'Intro' },
	body: '# Intro',
	rendered: { html: '<h1>Intro</h1>' },
};

async function createStoredSource() {
	const driver = createMemoryStorageDriver();
	const writer = await driver.openWriter({ snapshot: 'build-1', dev: false });
	await writer.write('docs', [serializeEntry(intro)]);
	await writer.commit();
	let created = 0;
	const source = new StoredCollectionsSource([
		{
			createDriver: () => {
				created++;
				return driver;
			},
			snapshot: 'build-1',
			collections: ['docs'],
		},
	]);
	return { source, getCreated: () => created };
}

describe('StoredCollectionsSource', () => {
	it('reads entries with and without content', async () => {
		const { source } = await createStoredSource();

		assert.deepEqual(await source.get('docs', 'intro'), intro);
		assert.deepEqual(await source.values('docs'), [intro]);
		assert.deepEqual(await source.get('docs', 'intro', { content: false }), {
			id: 'intro',
			data: { title: 'Intro' },
		});
		assert.deepEqual(await source.values('docs', { content: false }), [
			{ id: 'intro', data: { title: 'Intro' } },
		]);
		assert.equal(await source.get('docs', 'missing'), undefined);
	});

	it('drops content returned by a driver when it was not requested', async () => {
		const source = new StoredCollectionsSource([
			{
				createDriver: () => ({
					openWriter: async () => ({ write: async () => {}, commit: async () => {} }),
					openReader: async () => ({
						get: async () => serializeEntry(intro),
						entries: async () => [serializeEntry(intro)],
					}),
				}),
				snapshot: 'build-1',
				collections: ['docs'],
			},
		]);

		assert.equal((await source.get('docs', 'intro', { content: false }))?.body, undefined);
		assert.equal((await source.values('docs', { content: false }))[0].rendered, undefined);
	});

	it('creates the driver once and reads the snapshot of its build', async () => {
		const { source, getCreated } = await createStoredSource();

		await source.get('docs', 'intro');
		await source.values('docs');

		assert.equal(getCreated(), 1);
	});

	it('reports stored collections as existing, even when empty', async () => {
		const { source } = await createStoredSource();

		assert.equal(source.hasCollection('docs'), true);
		assert.equal(source.hasCollection('authors'), false);
	});
});

describe('InMemorySource', () => {
	it('returns entries without content when asked', async () => {
		const store = await ImmutableDataStore.fromMap(
			new Map([['docs', new Map([['intro', intro]])]]),
		);
		const source = new InMemorySource(store);

		assert.deepEqual(source.get('docs', 'intro', { content: false }), {
			id: 'intro',
			data: { title: 'Intro' },
		});
		assert.deepEqual(source.values('docs', { content: false }), [
			{ id: 'intro', data: { title: 'Intro' } },
		]);
		assert.deepEqual(source.get('docs', 'intro'), intro);
	});
});

describe('CompositeSource', () => {
	it('reads stored collections from the stored source', async () => {
		const { source: stored } = await createStoredSource();
		const bundled = new InMemorySource(
			await ImmutableDataStore.fromMap(
				new Map([['authors', new Map([['alice', { id: 'alice', data: {} }]])]]),
			),
		);
		const source = new CompositeSource(bundled, stored, new Set(['docs']));

		assert.deepEqual(await source.get('docs', 'intro'), intro);
		assert.deepEqual(await source.get('authors', 'alice'), { id: 'alice', data: {} });
		assert.equal(await source.hasCollection('authors'), true);
	});
});

describe('generateCollectionStorageModule', () => {
	it('bundles each driver with its snapshot and collections', () => {
		const code = generateCollectionStorageModule(
			{
				drivers: [
					{ entrypoint: 'my-driver', config: { url: 'x' }, snapshot: 'a', collections: ['docs'] },
					{ entrypoint: '/project/driver.mjs', snapshot: 'b', collections: ['guides'] },
				],
			},
			true,
		);

		assert.match(code, /import createDriver0 from "my-driver";/);
		assert.match(code, /import createDriver1 from "\/project\/driver\.mjs";/);
		assert.match(code, /snapshot:"a",collections:\["docs"\]/);
		assert.match(code, /config:\{"url":"x"\}/);
		assert.match(code, /export const contentOptionEnabled = true;/);
	});

	it('exports no drivers without a manifest', () => {
		assert.match(generateCollectionStorageModule(undefined, false), /export default \[\];$/);
		assert.match(
			generateCollectionStorageModule(undefined, false),
			/export const contentOptionEnabled = false;/,
		);
	});
});
