import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	shouldStripSpreadScopeArg,
	stripIncorrectSpreadScopeClass,
} from '../../../dist/core/compile/strip-incorrect-spread-scope.js';

describe('stripIncorrectSpreadScopeClass', () => {
	it('removes injected scope class argument from compiler-shaped spreadAttributes', () => {
		const input = `$$spreadAttributes(props,undefined,{"class":"astro-abc12"})`;
		assert.equal(stripIncorrectSpreadScopeClass(input), '$$spreadAttributes(props)');
	});

	it('supports member expression as first argument', () => {
		const input = `$$spreadAttributes(foo.bar,undefined,{"class":"astro-abc12"})`;
		assert.equal(stripIncorrectSpreadScopeClass(input), '$$spreadAttributes(foo.bar)');
	});

	it('leaves two-argument spreadAttributes unchanged', () => {
		const input = '$$spreadAttributes(x)';
		assert.equal(stripIncorrectSpreadScopeClass(input), input);
	});

	it('leaves spread with scope when pattern is not the synthetic undefined + class object', () => {
		const input = `$$spreadAttributes(x, undefined, other)`;
		assert.equal(stripIncorrectSpreadScopeClass(input), input);
	});

	it('shouldStripSpreadScopeArg', () => {
		assert.equal(shouldStripSpreadScopeArg([]), false);
		assert.equal(shouldStripSpreadScopeArg([{ isGlobal: true }]), true);
		assert.equal(shouldStripSpreadScopeArg([{ isGlobal: false }]), false);
		assert.equal(shouldStripSpreadScopeArg([{ isGlobal: true }, { isGlobal: false }]), false);
	});
});
