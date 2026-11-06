import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchesLevel } from '../../../dist/core/logger/public.js';

describe('matchesLevel', () => {
	it('returns true when message level equals configured level', () => {
		assert.equal(matchesLevel('info', 'info'), true);
		assert.equal(matchesLevel('warn', 'warn'), true);
		assert.equal(matchesLevel('error', 'error'), true);
		assert.equal(matchesLevel('debug', 'debug'), true);
		assert.equal(matchesLevel('silent', 'silent'), true);
	});

	it('returns true when message level is higher than configured level', () => {
		assert.equal(matchesLevel('error', 'info'), true);
		assert.equal(matchesLevel('warn', 'info'), true);
		assert.equal(matchesLevel('error', 'warn'), true);
		assert.equal(matchesLevel('silent', 'debug'), true);
	});

	it('returns false when message level is lower than configured level', () => {
		assert.equal(matchesLevel('info', 'warn'), false);
		assert.equal(matchesLevel('info', 'error'), false);
		assert.equal(matchesLevel('warn', 'error'), false);
		assert.equal(matchesLevel('debug', 'info'), false);
	});

	it('debug configured level allows all non-silent levels', () => {
		assert.equal(matchesLevel('debug', 'debug'), true);
		assert.equal(matchesLevel('info', 'debug'), true);
		assert.equal(matchesLevel('warn', 'debug'), true);
		assert.equal(matchesLevel('error', 'debug'), true);
	});

	it('silent configured level only matches silent', () => {
		assert.equal(matchesLevel('debug', 'silent'), false);
		assert.equal(matchesLevel('info', 'silent'), false);
		assert.equal(matchesLevel('warn', 'silent'), false);
		assert.equal(matchesLevel('error', 'silent'), false);
		assert.equal(matchesLevel('silent', 'silent'), true);
	});

	it('error message level is only suppressed by silent', () => {
		assert.equal(matchesLevel('error', 'debug'), true);
		assert.equal(matchesLevel('error', 'info'), true);
		assert.equal(matchesLevel('error', 'warn'), true);
		assert.equal(matchesLevel('error', 'error'), true);
		assert.equal(matchesLevel('error', 'silent'), false);
	});
});
