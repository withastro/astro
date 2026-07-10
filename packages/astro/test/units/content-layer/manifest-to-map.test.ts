import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import * as devalue from 'devalue';
import { ImmutableDataStore } from '../../../dist/content/data-store.js';

function serialize(entries: Array<[string, any]>): string {
	return devalue.stringify(new Map(entries));
}

describe('Content Layer - manifestToMap', () => {
	it('parses a collection with a single part', () => {
		const part = serialize([
			['one', { id: 'one', data: { n: 1 } }],
			['two', { id: 'two', data: { n: 2 } }],
		]);
		const map = ImmutableDataStore.manifestToMap({ blog: [part] });
		assert.deepEqual([...map.keys()], ['blog']);
		const blog: any = map.get('blog');
		assert.equal(blog.size, 2);
		assert.deepEqual(blog.get('one'), { id: 'one', data: { n: 1 } });
		assert.deepEqual(blog.get('two'), { id: 'two', data: { n: 2 } });
	});

	it('concatenates multiple parts before parsing', () => {
		const serialized = serialize([['a', { id: 'a', data: { n: 1 } }]]);
		const mid = Math.floor(serialized.length / 2);
		const parts = [serialized.slice(0, mid), serialized.slice(mid)];
		const map = ImmutableDataStore.manifestToMap({ blog: parts });
		const blog: any = map.get('blog');
		assert.deepEqual(blog.get('a'), { id: 'a', data: { n: 1 } });
	});

	it('rebuilds multiple collections', () => {
		const blog = serialize([['post', { id: 'post', data: { title: 'Hi' } }]]);
		const authors = serialize([['jane', { id: 'jane', data: { name: 'Jane' } }]]);
		const map = ImmutableDataStore.manifestToMap({ blog: [blog], authors: [authors] });
		assert.deepEqual([...map.keys()], ['blog', 'authors']);
		const blogMap: any = map.get('blog');
		const authorsMap: any = map.get('authors');
		assert.deepEqual(blogMap.get('post'), { id: 'post', data: { title: 'Hi' } });
		assert.deepEqual(authorsMap.get('jane'), { id: 'jane', data: { name: 'Jane' } });
	});

	it('accepts parts as raw-import namespaces ({ default: string })', () => {
		const serialized = serialize([['a', { id: 'a', data: { n: 1 } }]]);
		const mid = Math.floor(serialized.length / 2);
		const parts = [{ default: serialized.slice(0, mid) }, serialized.slice(mid)];
		const map = ImmutableDataStore.manifestToMap({ blog: parts });
		const blog: any = map.get('blog');
		assert.deepEqual(blog.get('a'), { id: 'a', data: { n: 1 } });
	});

	it('returns an empty map for an empty manifest', () => {
		const map = ImmutableDataStore.manifestToMap({});
		assert.equal(map.size, 0);
	});
});
