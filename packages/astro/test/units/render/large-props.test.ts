import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPropsLength, hasLargeProps } from '../../../dist/core/render/large-props.js';

describe('getPropsLength', () => {
	it('counts strings, keys and nested values', () => {
		const sizes = new WeakMap<object, number>();
		assert.equal(getPropsLength('hello', sizes), 5);
		assert.ok(getPropsLength({ a: 'x'.repeat(100), b: ['y'.repeat(50)] }, sizes) > 150);
		assert.ok(getPropsLength(new Map([['k', 'v'.repeat(20)]]), sizes) > 20);
		assert.ok(getPropsLength(new Set(['s'.repeat(30)]), sizes) > 30);
	});

	it('counts shared objects every time they appear', () => {
		const shared = { text: 'x'.repeat(1000) };
		const sizes = new WeakMap<object, number>();
		const once = getPropsLength(shared, sizes);
		assert.ok(getPropsLength({ a: shared, b: shared }, sizes) > 2 * once);
	});

	it('handles cycles', () => {
		const value: Record<string, unknown> = { text: 'x'.repeat(10) };
		value.self = value;
		assert.ok(getPropsLength(value, new WeakMap<object, number>()) >= 10);
	});
});

describe('hasLargeProps', () => {
	it('checks the total of all paths against the limit', () => {
		const paths = Array.from({ length: 10 }, () => ({ props: { text: 'x'.repeat(100) } }));
		assert.equal(hasLargeProps(paths, 2000), false);
		assert.equal(hasLargeProps(paths, 500), true);
		assert.equal(hasLargeProps([{}, { props: undefined }], 0), true);
		assert.equal(hasLargeProps([], 0), false);
	});

	it('extrapolates from a sample of the paths', () => {
		const paths = Array.from({ length: 10_000 }, () => ({ props: { text: 'x'.repeat(100) } }));
		assert.equal(hasLargeProps(paths, 900_000), true);
		assert.equal(hasLargeProps(paths, 1_200_000), false);
	});
});
