import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * Extracted from server.ts check() — the object-component branch.
 * Tests that non-React objects with missing $$typeof don't crash.
 * See https://github.com/withastro/astro/issues/17552
 */
function checkObjectComponent(Component: Record<string, any>): boolean {
	const $$typeof = Component['$$typeof'];
	return $$typeof != null && $$typeof.toString().slice('Symbol('.length).startsWith('react');
}

describe('check() object component branch', () => {
	it('returns false for objects without $$typeof', () => {
		assert.equal(checkObjectComponent({}), false);
	});

	it('returns false for objects with $$typeof set to undefined', () => {
		assert.equal(checkObjectComponent({ $$typeof: undefined }), false);
	});

	it('returns false for objects with $$typeof set to null', () => {
		assert.equal(checkObjectComponent({ $$typeof: null }), false);
	});

	it('returns false for non-React symbols', () => {
		assert.equal(checkObjectComponent({ $$typeof: Symbol.for('svelte.component') }), false);
	});

	it('returns true for react element symbols', () => {
		assert.equal(checkObjectComponent({ $$typeof: Symbol.for('react.element') }), true);
	});

	it('returns true for react.transitional.element symbols', () => {
		assert.equal(
			checkObjectComponent({ $$typeof: Symbol.for('react.transitional.element') }),
			true,
		);
	});

	it('returns true for react.forward_ref symbols', () => {
		assert.equal(checkObjectComponent({ $$typeof: Symbol.for('react.forward_ref') }), true);
	});
});
