// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deduplicateDirectiveValues, pushDirective } from '../../../dist/core/csp/runtime.js';

describe('deduplicateDirectiveValues', () => {
	it('merges directives', () => {
		let result = deduplicateDirectiveValues("img-src 'self'", 'img-src https://example.com');

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});

	it('deduplicate directives', () => {
		let result = deduplicateDirectiveValues("img-src 'self'", "img-src 'self' https://example.com");

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});

	it('handles duplicates', () => {
		let result = deduplicateDirectiveValues("img-src 'self'", "img-src 'self' https://example.com");

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});

	it("should return the existing directive if they don't match", () => {
		let result = deduplicateDirectiveValues("img-src 'self'", 'font-src https://example.com');

		assert.deepStrictEqual(result, undefined);
	});

	it('handle multiple spaces', () => {
		let result = deduplicateDirectiveValues(
			"img-src     'self'    ",
			"img-src    'self'     https://example.com",
		);

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});
});

describe('pushDirective', () => {
	it('adds new and dedupes the ones that are the same', () => {
		const result = pushDirective(
			["img-src 'self'", "default-src 'self'"],
			'img-src https://example.com',
		);

		assert.deepStrictEqual(result, ["img-src 'self' https://example.com", "default-src 'self'"]);
	});
});
