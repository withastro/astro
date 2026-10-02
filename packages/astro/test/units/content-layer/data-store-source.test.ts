import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	CompositeSource,
	ExternalSource,
	InMemorySource,
} from '../../../dist/content/data-store-source.js';
import { ImmutableDataStore } from '../../../dist/content/data-store.js';
import { ExternalDataStore } from '../../../dist/content/external-data-store.js';
import { createMemoryStorageDriver } from './test-helpers.ts';

const post = {
	id: 'hello',
	data: { title: 'Hello' },
	body: '# Hello',
	rendered: { html: '<h1>Hello</h1>' },
	filePath: 'src/posts/hello.md',
};

async function createExternalSource() {
	const driver = createMemoryStorageDriver();
	await new ExternalDataStore(driver).scopedStore('posts').set(post);
	return new ExternalSource(driver);
}

async function createMemorySource() {
	return new InMemorySource(
		await ImmutableDataStore.fromMap(new Map([['authors', new Map([['ada', { id: 'ada' }]])]])),
	);
}

describe('ExternalSource', () => {
	it('reads the entries saved by the driver', async () => {
		const source = await createExternalSource();

		assert.equal(await source.hasCollection('posts'), true);
		assert.equal(await source.hasCollection('authors'), false);
		assert.deepEqual(await source.get('posts', 'hello'), post);
		assert.equal(await source.get('posts', 'missing'), undefined);
		assert.deepEqual(await source.values('posts'), [post]);
		assert.deepEqual(await source.entries('posts'), [['hello', post]]);
		assert.deepEqual(await source.keys('posts'), ['hello']);
		assert.equal(await source.has('posts', 'hello'), true);
		assert.equal(await source.has('posts', 'missing'), false);
	});

	it('reads metadata without the body and rendered content', async () => {
		const source = await createExternalSource();
		const { body: _body, rendered: _rendered, ...metadata } = post;

		assert.deepEqual(await source.metadata('posts'), [metadata]);
	});
});

describe('InMemorySource', () => {
	it('reads metadata without the body and rendered content', async () => {
		const source = new InMemorySource(
			await ImmutableDataStore.fromMap(new Map([['posts', new Map([['hello', post]])]])),
		);
		const { body: _body, rendered: _rendered, ...metadata } = post;

		assert.deepEqual(source.metadata('posts'), [metadata]);
		assert.deepEqual(source.values('posts'), [post]);
	});
});

describe('CompositeSource', () => {
	it('reads external collections from the driver and the others from memory', async () => {
		const memory = await createMemorySource();
		const source = new CompositeSource(memory, await createExternalSource(), ['posts']);

		assert.deepEqual(await source.keys('posts'), ['hello']);
		assert.deepEqual(await source.keys('authors'), ['ada']);
		assert.equal(await source.has('authors', 'ada'), true);
		assert.equal(await source.hasCollection('posts'), true);
		assert.deepEqual(await source.get('posts', 'hello'), post);
		assert.deepEqual(source.collections(), memory.collections());
	});

	it('does not read the in-memory entries of external collections', async () => {
		const memory = new InMemorySource(
			await ImmutableDataStore.fromMap(
				new Map([['posts', new Map([['stale', { id: 'stale', data: {} }]])]]),
			),
		);
		const source = new CompositeSource(memory, await createExternalSource(), ['posts']);

		assert.deepEqual(await source.keys('posts'), ['hello']);
	});
});
