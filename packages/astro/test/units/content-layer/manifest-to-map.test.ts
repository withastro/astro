import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import * as devalue from 'devalue';
import { ImmutableDataStore } from '../../../dist/content/data-store.js';

function serializeChunk(entries: Array<[string, any]>): string {
	return devalue.stringify(new Map(entries));
}

describe('Content Layer - manifestToMap', () => {
	it('parses a collection with a single chunk of one part', () => {
		const chunk = serializeChunk([
			['one', { id: 'one', data: { n: 1 } }],
			['two', { id: 'two', data: { n: 2 } }],
		]);
		const map = ImmutableDataStore.manifestToMap({ blog: [[chunk]] });
		assert.deepEqual([...map.keys()], ['blog']);
		const blog: any = map.get('blog');
		assert.equal(blog.size, 2);
		assert.deepEqual(blog.get('one'), { id: 'one', data: { n: 1 } });
		assert.deepEqual(blog.get('two'), { id: 'two', data: { n: 2 } });
	});

	it('concatenates the parts of a chunk before parsing', () => {
		const chunk = serializeChunk([['a', { id: 'a', data: { n: 1 } }]]);
		const mid = Math.floor(chunk.length / 2);
		const parts = [chunk.slice(0, mid), chunk.slice(mid)];
		const map = ImmutableDataStore.manifestToMap({ blog: [parts] });
		const blog: any = map.get('blog');
		assert.deepEqual(blog.get('a'), { id: 'a', data: { n: 1 } });
	});

	it('merges multiple chunks into a single collection', () => {
		const first = serializeChunk([
			['a', { id: 'a', data: { n: 1 } }],
			['b', { id: 'b', data: { n: 2 } }],
		]);
		const second = serializeChunk([
			['c', { id: 'c', data: { n: 3 } }],
			['d', { id: 'd', data: { n: 4 } }],
		]);
		const map = ImmutableDataStore.manifestToMap({ blog: [[first], [second]] });
		const blog: any = map.get('blog');
		assert.equal(blog.size, 4);
		assert.deepEqual([...blog.keys()], ['a', 'b', 'c', 'd']);
		assert.deepEqual(blog.get('d'), { id: 'd', data: { n: 4 } });
	});

	it('rebuilds multiple collections', () => {
		const blog = serializeChunk([['post', { id: 'post', data: { title: 'Hi' } }]]);
		const authors = serializeChunk([['jane', { id: 'jane', data: { name: 'Jane' } }]]);
		const map = ImmutableDataStore.manifestToMap({ blog: [[blog]], authors: [[authors]] });
		assert.deepEqual([...map.keys()], ['blog', 'authors']);
		const blogMap: any = map.get('blog');
		const authorsMap: any = map.get('authors');
		assert.deepEqual(blogMap.get('post'), { id: 'post', data: { title: 'Hi' } });
		assert.deepEqual(authorsMap.get('jane'), { id: 'jane', data: { name: 'Jane' } });
	});

	it('accepts parts as raw-import namespaces ({ default: string })', () => {
		const chunk = serializeChunk([['a', { id: 'a', data: { n: 1 } }]]);
		const mid = Math.floor(chunk.length / 2);
		const parts = [{ default: chunk.slice(0, mid) }, chunk.slice(mid)];
		const map = ImmutableDataStore.manifestToMap({ blog: [parts] });
		const blog: any = map.get('blog');
		assert.deepEqual(blog.get('a'), { id: 'a', data: { n: 1 } });
	});

	it('returns an empty map for an empty manifest', () => {
		const map = ImmutableDataStore.manifestToMap({});
		assert.equal(map.size, 0);
	});
});
