import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MultiLevelEncodingError, normalizePathname } from '../../../dist/core/util/pathname.js';

/**
 * `normalizePathname` is the security-hardened default used by `FetchState`.
 * On top of the iterative decode done by `validateAndDecodePathname` (covered
 * in its own suite) it adds two canonicalization steps that matter for
 * middleware-authorization safety:
 *
 *   1. rewrites backslashes to forward slashes (matching the WHATWG URL parser)
 *   2. collapses runs of duplicate slashes
 *
 * These tests focus on that composed behavior — especially that an attacker
 * cannot smuggle a protected path (e.g. `/admin`) past a `startsWith`-style
 * middleware check by encoding backslashes or duplicating slashes.
 */
describe('normalizePathname (default)', () => {
	// #region Leaves canonical paths untouched

	it('returns plain paths unchanged', () => {
		assert.equal(normalizePathname('/api/admin/users'), '/api/admin/users');
	});

	it('returns the root path unchanged', () => {
		assert.equal(normalizePathname('/'), '/');
	});

	// #endregion
	// #region Decoding (delegated to validateAndDecodePathname)

	it('decodes single-encoded characters', () => {
		assert.equal(normalizePathname('/%2561dmin'), '/admin');
	});

	it('decodes an encoded percent to a bare percent (issue #16313)', () => {
		assert.equal(normalizePathname('/api/%25'), '/api/%');
	});

	it('fully decodes double-encoded brackets (issue #16960)', () => {
		assert.equal(normalizePathname('/sections%255B_key%255D'), '/sections[_key]');
	});

	// #endregion
	// #region Duplicate-slash collapse (prevents `//admin` bypass)

	it('collapses a leading double slash', () => {
		// `//admin` would otherwise slip past `pathname.startsWith('/admin')`.
		assert.equal(normalizePathname('//admin'), '/admin');
	});

	it('collapses duplicate slashes anywhere in the path', () => {
		assert.equal(normalizePathname('///a////b'), '/a/b');
	});

	// #endregion
	// #region Backslash normalization (prevents `%5Cadmin` bypass)

	it('rewrites an encoded backslash to a forward slash and collapses it', () => {
		// `%5C` → `\` → `/`, then the resulting `//` collapses to `/`.
		assert.equal(normalizePathname('/users/%5Cadmin'), '/users/admin');
	});

	it('handles lowercase-hex encoded backslashes', () => {
		assert.equal(normalizePathname('/users/%5cadmin'), '/users/admin');
	});

	it('handles multiple encoded backslashes', () => {
		assert.equal(normalizePathname('/users/%5C%5Cadmin'), '/users/admin');
	});

	it('rewrites a literal (already-decoded) backslash', () => {
		assert.equal(normalizePathname('/users/\\admin'), '/users/admin');
		assert.equal(normalizePathname('/a\\b\\c'), '/a/b/c');
	});

	it('collapses slashes introduced by a backslash between existing slashes', () => {
		// `/a/\/b` → `/a///b` → `/a/b`
		assert.equal(normalizePathname('/a/%5C/b'), '/a/b');
	});

	it('normalizes double-encoded backslashes (decode happens before the rewrite)', () => {
		// `%255C` → `%5C` → `\` → `/`
		assert.equal(normalizePathname('/users/%255Cadmin'), '/users/admin');
		assert.equal(normalizePathname('/%255C%255Cadmin'), '/admin');
	});

	// #endregion
	// #region Encoded slashes are NOT turned into path separators
	//
	// `decodeURI` intentionally preserves the reserved `%2F`, so an encoded
	// slash never becomes a real separator that could be collapsed away. This
	// keeps encoded-slash path-traversal attempts from being canonicalized
	// into a different, possibly protected, path.

	it('preserves a reserved encoded slash (%2F)', () => {
		assert.equal(normalizePathname('/api%2Fadmin'), '/api%2Fadmin');
	});

	it('does not collapse double-encoded slashes into real separators', () => {
		assert.equal(normalizePathname('/api/%252Fadmin'), '/api/%2Fadmin');
		assert.equal(normalizePathname('/%252F%252Fadmin'), '/%2F%2Fadmin');
	});

	// #endregion
	// #region Rejects malformed / over-encoded input

	it('throws for malformed percent-encoding', () => {
		assert.throws(() => normalizePathname('/api/%GG'), (err: any) => err instanceof Error);
	});

	it('throws for truncated percent-encoding', () => {
		assert.throws(() => normalizePathname('/api/%6'), (err: any) => err instanceof Error);
	});

	it('decodes a path encoded right up to the limit (10 times)', () => {
		assert.equal(normalizePathname('/api/%25252525252525252561dmin'), '/api/admin');
	});

	it('throws MultiLevelEncodingError once encoded past the limit', () => {
		assert.throws(
			() => normalizePathname('/api/%2525252525252525252561dmin'),
			(err: any) => err instanceof MultiLevelEncodingError,
		);
	});

	// #endregion
});
