import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import dlv from '../../../dist/preferences/dlv.js';

describe('dlv', () => {
	it('returns correct value', () => {
		const data = { a: { b: { c: 42 } } };
		assert.equal(dlv(data, 'a.b.c'), 42);
	});

	it('returns undefined for missing keys', () => {
		const data = { a: { b: 2 } };
		assert.equal(dlv(data, 'a.c'), undefined);
	});

	it('returns undefined for missing keys in the middle of the path', () => {
		const data = { a: { b: 2 } };
		assert.equal(dlv(data, 'a.c.z'), undefined);
	});
});
