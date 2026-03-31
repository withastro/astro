import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLocalsSerializable, trySerializeLocals } from '../../../dist/core/middleware/index.js';

describe('isLocalsSerializable', () => {
	it('returns true for null', () => {
		assert.equal(isLocalsSerializable(null), true);
	});

	it('returns true for string', () => {
		assert.equal(isLocalsSerializable('hello'), true);
	});

	it('returns true for number', () => {
		assert.equal(isLocalsSerializable(42), true);
	});

	it('returns true for boolean', () => {
		assert.equal(isLocalsSerializable(true), true);
		assert.equal(isLocalsSerializable(false), true);
	});

	it('returns true for a plain object', () => {
		assert.equal(isLocalsSerializable({ a: 1, b: 'two' }), true);
	});

	it('returns true for a nested plain object', () => {
		assert.equal(isLocalsSerializable({ a: { b: { c: 3 } } }), true);
	});

	it('returns true for an array', () => {
		assert.equal(isLocalsSerializable([1, 'two', null]), true);
	});

	it('returns false for a Date', () => {
		assert.equal(isLocalsSerializable(new Date()), false);
	});

	it('returns false for a Map', () => {
		assert.equal(isLocalsSerializable(new Map()), false);
	});

	it('returns false for a Set', () => {
		assert.equal(isLocalsSerializable(new Set()), false);
	});

	it('returns false for a class instance', () => {
		class Foo {}
		assert.equal(isLocalsSerializable(new Foo()), false);
	});

	it('returns false for a plain object containing a non-serializable value', () => {
		assert.equal(isLocalsSerializable({ date: new Date() }), false);
	});

	it('handles deeply nested objects without stack overflow (iterative implementation)', () => {
		// Build a 10,000-level deep object — would overflow the call stack with recursion
		type DeepObject = { child?: DeepObject; value?: string };
		const deep: DeepObject = {};
		let current: DeepObject = deep;
		for (let i = 0; i < 10_000; i++) {
			current.child = {};
			current = current.child;
		}
		current.value = 'leaf';
		assert.equal(isLocalsSerializable(deep), true);
	});
});

describe('trySerializeLocals', () => {
	it('returns a JSON string for a serializable object', () => {
		const result = trySerializeLocals({ user: 'alice', count: 3 });
		assert.equal(typeof result, 'string');
		assert.deepEqual(JSON.parse(result), { user: 'alice', count: 3 });
	});

	it('throws for a non-serializable value', () => {
		assert.throws(() => trySerializeLocals({ date: new Date() }), /serialized/i);
	});
});
