import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ExternalDataStore } from '../../../dist/content/external-data-store.js';
import { isExternalLoaderContext } from '../../../dist/content/loaders/index.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { createMemoryStorageDriver } from './test-helpers.ts';

function createPost() {
	return {
		id: 'hello',
		data: { title: 'Hello', date: new Date('2026-01-01'), cover: '__ASTRO_IMAGE_./cover.png' },
		body: '# Hello',
		filePath: 'src/posts/hello.md',
		digest: 'abc',
		rendered: { html: '<h1>Hello</h1>', metadata: { headings: [] } },
	};
}

describe('ExternalDataStore', () => {
	it('saves the same entries as the in-memory store', async () => {
		const memory = new MutableDataStore().scopedStore('posts');
		const external = new ExternalDataStore(createMemoryStorageDriver()).scopedStore('posts');
		const inputs = [
			createPost,
			() => ({ id: 'data-only', data: { tags: ['a', 'b'] } }),
			() => ({
				id: 'deferred',
				data: {},
				filePath: 'src/posts/deferred.mdx',
				deferredRender: true,
			}),
		];

		for (const createInput of inputs) {
			const input = createInput();
			memory.set(createInput());
			assert.equal(await external.set(input), true);
			assert.deepEqual(await external.get(input.id), memory.get(input.id));
		}
	});

	it('reads entries without their body and rendered HTML', async () => {
		const driver = createMemoryStorageDriver();
		const store = new ExternalDataStore(driver).scopedStore('posts');
		await store.set(createPost());
		await store.set({ id: 'data-only', data: {} });

		const entry = await store.get('hello', { content: false });
		assert.equal(entry?.body, undefined);
		assert.equal(entry?.rendered, undefined);
		assert.equal(entry?.data.title, 'Hello');
		assert.equal(driver.entries.get('posts')?.get('data-only')?.content, undefined);

		const values = [];
		for await (const value of store.values({ content: false })) {
			values.push(value);
		}
		assert.deepEqual(
			values.map(({ id, body, rendered }) => ({ id, body, rendered })),
			[
				{ id: 'hello', body: undefined, rendered: undefined },
				{ id: 'data-only', body: undefined, rendered: undefined },
			],
		);
	});

	it('skips saving an entry with an unchanged digest', async () => {
		const driver = createMemoryStorageDriver();
		const store = new ExternalDataStore(driver).scopedStore('posts');

		assert.equal(await store.set(createPost()), true);
		assert.equal(await store.set(createPost()), false);
		assert.equal(driver.writes, 1);
		assert.equal(await store.set({ ...createPost(), digest: 'def' }), true);
		assert.equal(driver.writes, 2);
	});

	it('rejects entries without an ID or with an absolute file path', async () => {
		const store = new ExternalDataStore(createMemoryStorageDriver()).scopedStore('posts');

		await assert.rejects(store.set({ id: '', data: {} }), /ID must be a non-empty string/);
		await assert.rejects(
			store.set({ id: 'a', data: {}, filePath: '/src/a.md' }),
			/File path must be relative to the site root/,
		);
	});

	it('lists, checks, deletes and clears entries of its collection only', async () => {
		const external = new ExternalDataStore(createMemoryStorageDriver());
		const posts = external.scopedStore('posts');
		const authors = external.scopedStore('authors');
		await posts.set({ id: 'a', data: {} });
		await posts.set({ id: 'b', data: {} });
		await authors.set({ id: 'a', data: {} });

		assert.deepEqual(await posts.keys(), ['a', 'b']);
		const entries = [];
		for await (const [id, entry] of posts.entries()) {
			entries.push([id, entry.id]);
		}
		assert.deepEqual(entries, [
			['a', 'a'],
			['b', 'b'],
		]);

		await posts.delete('a');
		assert.equal(await posts.has('a'), false);
		assert.equal(await posts.has('b'), true);

		await posts.clear();
		assert.deepEqual(await posts.keys(), []);
		assert.equal(await authors.has('a'), true);
	});

	it('keeps meta values per collection, when entries are cleared', async () => {
		const external = new ExternalDataStore(createMemoryStorageDriver());
		const postsMeta = external.metaStore('posts');
		await postsMeta.set('token', '1');
		await external.scopedStore('posts').clear();

		assert.equal(await postsMeta.get('token'), '1');
		assert.equal(await postsMeta.has('token'), true);
		assert.equal(await external.metaStore('authors').has('token'), false);

		await postsMeta.delete('token');
		assert.equal(await postsMeta.get('token'), undefined);
	});
});

describe('isExternalLoaderContext', () => {
	it('tells whether a loader runs for a collection with external storage', () => {
		assert.equal(isExternalLoaderContext({ storage: 'external' } as any), true);
		assert.equal(isExternalLoaderContext({ collection: 'posts' } as any), false);
	});
});
