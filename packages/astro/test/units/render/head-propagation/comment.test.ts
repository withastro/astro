import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasHeadPropagationCall } from '../../../../dist/core/head-propagation/hint.js';

describe('head propagation directive detection', () => {
	it('detects "use astro:head-inject" directive at start of source', () => {
		assert.equal(hasHeadPropagationCall('"use astro:head-inject";\nexport default 1;'), true);
	});

	it('detects "use astro:head-inject" directive anywhere in source', () => {
		assert.equal(hasHeadPropagationCall('const a = 1;\n"use astro:head-inject";'), true);
	});

	it('detects "use astro:head-inject" directive in the middle of a line', () => {
		assert.equal(hasHeadPropagationCall('export const x = "use astro:head-inject";'), true);
	});

	it('does not match unrelated comments', () => {
		assert.equal(hasHeadPropagationCall('// something else'), false);
	});

	it('does not match the old astro-head-inject comment marker', () => {
		assert.equal(hasHeadPropagationCall('// astro-head-inject'), false);
	});

	it('does not match the old $$astro_head_inject marker', () => {
		assert.equal(hasHeadPropagationCall('$$astro_head_inject()'), false);
	});

	it('does not match a partial directive', () => {
		assert.equal(hasHeadPropagationCall('"use head-inject";'), false);
	});
});
