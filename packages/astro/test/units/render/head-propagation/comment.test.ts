import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasHeadInjectComment } from '../../../../dist/core/head-propagation/comment.js';

describe('head propagation comment detection', () => {
	it('detects $$astro_head_inject at start of source', () => {
		assert.equal(hasHeadInjectComment('$$astro_head_inject\nexport default 1;'), true);
	});

	it('detects $$astro_head_inject anywhere in source', () => {
		assert.equal(hasHeadInjectComment('const a = 1;\n//! $$astro_head_inject'), true);
	});

	it('detects $$astro_head_inject in the middle of a line', () => {
		assert.equal(hasHeadInjectComment('export const x = "$$astro_head_inject";'), true);
	});

	it('does not match unrelated comments', () => {
		assert.equal(hasHeadInjectComment('// something else'), false);
	});

	it('does not match the old astro-head-inject marker', () => {
		assert.equal(hasHeadInjectComment('// astro-head-inject'), false);
	});

	it('does not partially match a similar but different marker', () => {
		assert.equal(hasHeadInjectComment('$$astro_head_inject_extra'), true);
	});
});
