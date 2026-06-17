import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateAndDecodePathname } from '../../../dist/core/util/pathname.js';

describe('validateAndDecodePathname', () => {
	it('allows encoded reserved characters after decoded path characters', () => {
		assert.equal(validateAndDecodePathname('/foo%20%26bar'), '/foo %26bar');
		assert.equal(validateAndDecodePathname('/docs/a%20%26b'), '/docs/a %26b');
	});

	it('keeps existing single-level encoded pathname behavior', () => {
		assert.equal(validateAndDecodePathname('/foo%20bar'), '/foo bar');
		assert.equal(validateAndDecodePathname('/foo%26bar'), '/foo%26bar');
		assert.equal(validateAndDecodePathname('/foo%3Fbar'), '/foo%3Fbar');
	});

	it('rejects invalid URL encoding', () => {
		assert.throws(() => validateAndDecodePathname('/foo%'), /Invalid URL encoding/);
		assert.throws(() => validateAndDecodePathname('/foo%2'), /Invalid URL encoding/);
		assert.throws(() => validateAndDecodePathname('/foo%ZZ'), /Invalid URL encoding/);
	});

	it('canonicalizes multi-level encoded pathnames', () => {
		assert.equal(validateAndDecodePathname('/api/%2561dmin'), '/api/admin');
		assert.equal(validateAndDecodePathname('/%252e%252e/secret'), '/../secret');
	});
});
