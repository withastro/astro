import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createReference } from '../../../dist/content/runtime.js';

describe('createReference', () => {
	const reference = createReference();

	describe('1-arg form (OLD backward compat)', () => {
		it('returns an object with ~standard property (Standard Schema)', () => {
			const schema = reference('authors');
			assert.ok(schema !== null && typeof schema === 'object');
			assert.ok('~standard' in schema);
		});

		it('validates and transforms a string id', async () => {
			const schema = reference('authors');
			const result = await schema['~standard'].validate('ben-holmes');
			assert.ok(!result.issues);
			assert.deepEqual(result.value, { id: 'ben-holmes', collection: 'authors' });
		});

		it('validates and passes through an existing reference object', async () => {
			const schema = reference('authors');
			const result = await schema['~standard'].validate({ id: 'ben-holmes', collection: 'authors' });
			assert.ok(!result.issues);
			assert.deepEqual(result.value, { id: 'ben-holmes', collection: 'authors' });
		});
	});

	describe('2-arg form (NEW — for use in transform)', () => {
		it('returns {id, collection} directly', () => {
			const ref = reference('authors', 'ben-holmes');
			assert.deepEqual(ref, { id: 'ben-holmes', collection: 'authors' });
		});

		it('preserves the collection name', () => {
			const ref = reference('posts', 'my-post');
			assert.equal(ref.collection, 'posts');
			assert.equal(ref.id, 'my-post');
		});

		it('works with numeric string ids', () => {
			const ref = reference('items', '42');
			assert.deepEqual(ref, { id: '42', collection: 'items' });
		});

		it('does not return a schema (no ~standard property)', () => {
			const ref = reference('authors', 'ben-holmes');
			assert.ok(!('~standard' in ref));
		});
	});
});

describe('Standard Schema validation in getEntryData', () => {
	it('formatIssues formats Standard Schema issues correctly', async () => {
		const { formatIssues } = await import('../../../dist/content/standard-schema-errors.js');

		const issues = [
			{ message: 'Expected string', path: [{ key: 'title' }] },
			{ message: 'Expected number', path: [{ key: 'meta' }, { key: 'count' }] },
			{ message: 'Required field missing' },
		];

		const formatted = formatIssues(issues);
		assert.ok(formatted.includes('title'));
		assert.ok(formatted.includes('Expected string'));
		assert.ok(formatted.includes('meta.count'));
		assert.ok(formatted.includes('Expected number'));
		assert.ok(formatted.includes('Required field missing'));
	});
});
