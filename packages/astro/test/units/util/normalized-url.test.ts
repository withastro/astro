import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createNormalizedUrl, normalizeUrl } from '../../../dist/core/util/normalized-url.js';

describe('normalizeUrl', () => {
	// #region Plain paths (the common case: nothing to rewrite)

	it('leaves an ordinary path unchanged', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/about')).pathname, '/about');
	});

	it('leaves the root path unchanged', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/')).pathname, '/');
	});

	it('preserves the search and hash', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/x?q=1#h')).href, 'https://e.com/x?q=1#h');
	});

	it('returns the same URL object', () => {
		const url = new URL('https://e.com/a');
		assert.equal(normalizeUrl(url), url);
	});

	// #endregion
	// #region Duplicate slashes

	it('collapses duplicate slashes', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/a//b')).pathname, '/a/b');
		assert.equal(normalizeUrl(new URL('https://e.com///a///b')).pathname, '/a/b');
	});

	// #endregion
	// #region Encoding

	it('decodes single-encoded unreserved characters', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/api/%61dmin')).pathname, '/api/admin');
	});

	it('fully decodes multi-encoded unreserved characters', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/api/%2561dmin')).pathname, '/api/admin');
	});

	it('keeps reserved characters encoded', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/path%3Fname')).pathname, '/path%3Fname');
	});

	it('re-encodes characters the pathname setter escapes', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/a%20b')).pathname, '/a%20b');
	});

	// #endregion
	// #region Backslash

	// Pathname setter rewrites `\` to `/`, so collapse must run after the
	// decode is assigned: `/a%5C/b` -> `/a\/b` -> `/a//b` -> `/a/b`.
	it('collapses a slash introduced by decoding a backslash', () => {
		assert.equal(normalizeUrl(new URL('https://e.com/a%5C/b')).pathname, '/a/b');
	});

	// #endregion
});

describe('createNormalizedUrl', () => {
	it('parses and normalizes a request URL string', () => {
		assert.equal(createNormalizedUrl('https://e.com/a//%61dmin').pathname, '/a/admin');
	});
});
