import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasHeadPropagationCall } from '../../../../dist/core/head-propagation/hint.js';

describe('head propagation comment detection', () => {
	it('detects $$result._astro_head_inject at start of source', () => {
		assert.equal(hasHeadPropagationCall('$$result._astro_head_inject\nexport default 1;'), true);
	});

	it('detects $$result._astro_head_inject anywhere in source', () => {
		assert.equal(hasHeadPropagationCall('const a = 1;\n//! $$result._astro_head_inject'), true);
	});

	it('detects $$result._astro_head_inject in the middle of a line', () => {
		assert.equal(hasHeadPropagationCall('export const x = "$$result._astro_head_inject";'), true);
	});

	it('does not match unrelated comments', () => {
		assert.equal(hasHeadPropagationCall('// something else'), false);
	});

	it('does not match the old astro-head-inject marker', () => {
		assert.equal(hasHeadPropagationCall('// astro-head-inject'), false);
	});

	it('does not match bare _astro_head_inject without $$result prefix', () => {
		assert.equal(hasHeadPropagationCall('_astro_head_inject()'), false);
	});

	it('does not match $$astro_head_inject (old marker)', () => {
		assert.equal(hasHeadPropagationCall('$$astro_head_inject()'), false);
	});
});
