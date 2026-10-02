import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isRoute3xx } from '../../../dist/core/routing/internal/route-errors.js';

describe('isRoute3xx', () => {
	it('matches the 3xx route with or without a trailing slash', () => {
		assert.equal(isRoute3xx('/3xx'), true);
		assert.equal(isRoute3xx('/3xx/'), true);
	});

	it('does not match other routes', () => {
		assert.equal(isRoute3xx('/404'), false);
		assert.equal(isRoute3xx('/500'), false);
		assert.equal(isRoute3xx('/3xx/other'), false);
		assert.equal(isRoute3xx('/300'), false);
	});
});
