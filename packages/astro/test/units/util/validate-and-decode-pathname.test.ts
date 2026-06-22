import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateAndDecodePathname } from '../../../dist/core/util/pathname.js';

describe('validateAndDecodePathname', () => {
	// #region Plain paths (no encoding)

	it('returns plain paths unchanged', () => {
		assert.equal(validateAndDecodePathname('/api/admin/users'), '/api/admin/users');
	});

	it('returns root path unchanged', () => {
		assert.equal(validateAndDecodePathname('/'), '/');
	});

	// #endregion
	// #region Single encoding (legitimate, must pass)

	it('decodes single-encoded unreserved characters', () => {
		// %61 = 'a', %65 = 'e'
		assert.equal(validateAndDecodePathname('/api/%61dmin'), '/api/admin');
		assert.equal(validateAndDecodePathname('/api/us%65rs/list'), '/api/users/list');
	});

	it('preserves reserved characters that decodeURI does not decode', () => {
		// decodeURI intentionally does NOT decode reserved chars like %2F, %3F, %23
		const decoded = validateAndDecodePathname('/path%3Fname');
		assert.match(decoded, /%3F/i, 'reserved %3F should be preserved by decodeURI');
	});

	// #endregion
	// #region Double encoding (iteratively decoded, not rejected)
	//
	// Multi-level encoding is decoded iteratively until stable. This
	// ensures middleware always sees the canonical path and can make
	// correct authorization decisions (CVE-2025-66202 mitigation).

	it('fully decodes double-encoded unreserved chars: %2561 (a)', () => {
		// %2561 → decodeURI → %61 → decodeURI → a
		assert.equal(validateAndDecodePathname('/api/%2561dmin'), '/api/admin');
	});

	it('fully decodes double-encoded uppercase hex: %2541 (A)', () => {
		// %2541 → %41 → A
		assert.equal(validateAndDecodePathname('/api/%2541dmin'), '/api/Admin');
	});

	it('fully decodes double-encoded slash: %252F', () => {
		// %252F → %2F (decodeURI preserves reserved %2F)
		assert.equal(validateAndDecodePathname('/api/%252F'), '/api/%2F');
	});

	it('fully decodes double-encoded null byte: %2500', () => {
		// %2500 → %00 → \x00
		assert.equal(validateAndDecodePathname('/api/%2500'), '/api/\x00');
	});

	it('fully decodes double-encoded percent: %2525', () => {
		// %2525 → %25 → %
		assert.equal(validateAndDecodePathname('/api/%2525'), '/api/%');
	});

	it('fully decodes triple-encoded paths: %252561', () => {
		// %252561 → %2561 → %61 → but wait: decodeURI('%252561') → '%2561'
		// then decodeURI('%2561') → '%61' (because %25→%, 61 stays)
		// Hmm, let's check: %25 decodes to %, so %2561 → %61,
		// which is NOT decoded by decodeURI in one pass...
		// Actually: decodeURI('%252561') → first decode: %25→%, 25→stays, 61→stays → %2561
		// Wait no. The URL is: %252561. decodeURI processes %25 → %, giving us "2561".
		// So the result is: "%2561" → which is "%25" + "61" decoded one more level → "a"
		// But we have "%2561" not "%25" + "61". Let me trace carefully:
		// Input: /api/%252561dmin
		// Pass 1: decodeURI → /api/%2561dmin (%25→%, "25" stays as chars, "61dmin" stays)
		// Wait: %252561 — decodeURI scans left-to-right for %XX patterns.
		// %25 matches → decodes to '%'. Next chars are '2561dmin'.
		// So after pass 1: /api/%2561dmin
		// Pass 2: decodeURI('/api/%2561dmin') → /api/%61dmin (%25→%, "61" stays)
		// Wait: %2561 — %25 matches → decodes to '%'. Next chars are '61dmin'.
		// So after pass 2: /api/%61dmin
		// Pass 3: decodeURI('/api/%61dmin') → /api/admin (%61→a)
		// So: /api/%252561dmin → /api/admin
		assert.equal(validateAndDecodePathname('/api/%252561dmin'), '/api/admin');
	});

	it('fully decodes when double-encoding appears mid-path', () => {
		assert.equal(validateAndDecodePathname('/some/path/%2561dmin/rest'), '/some/path/admin/rest');
	});

	it('fully decodes when multiple double-encoded segments exist', () => {
		assert.equal(validateAndDecodePathname('/api/%2561dmin/%2575sers'), '/api/admin/users');
	});

	it('decodes %25 followed by literal hex chars (%25AB) to single-encoded form', () => {
		// %25AB → %AB (decodeURI does not decode %AB since 0xAB is not valid
		// standalone UTF-8, so iteration stops at %AB)
		assert.equal(validateAndDecodePathname('/path/%25AB'), '/path/%AB');
	});

	// #endregion
	// #region Creative triple-encoding (iteratively decoded)

	it('fully decodes creative triple-encoding: %25%32%3561dmin', () => {
		// %25 → %, %32 → 2, %35 → 5; pass 1 decoded = %2561dmin
		// pass 2: %25 → %, 61 stays; decoded = %61dmin
		// pass 3: %61 → a; decoded = admin
		assert.equal(validateAndDecodePathname('/api/%25%32%3561dmin'), '/api/admin');
	});

	it('decodes creative encoding of %252F via hex-encoded digits', () => {
		// %25%32%46 → decodeURI → %2F (reserved, stays)
		const decoded = validateAndDecodePathname('/api/%25%32%46');
		assert.equal(decoded, '/api/%2F');
	});

	it('fully decodes creative triple-encoding of %2525 via hex-encoded digits', () => {
		// %25%32%35%36%31dmin → pass 1 → %2561dmin → pass 2 → %61dmin → pass 3 → admin
		assert.equal(validateAndDecodePathname('/api/%25%32%35%36%31dmin'), '/api/admin');
	});

	// #endregion
	// #region %25 followed by another %XX (must pass — not double-encoding)
	//
	// encodeURIComponent('%?.pdf') → %25%3F.pdf
	// This is a literal encoded % next to an encoded ?, NOT double-encoding.

	it('allows %25%3F (encoded literal % next to encoded ?)', () => {
		const decoded = validateAndDecodePathname('/uploads/%25%3F.pdf');
		// %25 → %, %3F stays (reserved, decodeURI does not decode it)
		assert.equal(decoded, '/uploads/%%3F.pdf');
	});

	it('allows %25%23 (encoded literal % next to encoded #)', () => {
		const decoded = validateAndDecodePathname('/uploads/%25%23file');
		assert.equal(decoded, '/uploads/%%23file');
	});

	it('allows %25%26 (encoded literal % next to encoded &)', () => {
		const decoded = validateAndDecodePathname('/path/%25%26data');
		assert.equal(decoded, '/path/%%26data');
	});

	it('allows %25 at end of path (literal percent, no following hex pair)', () => {
		const decoded = validateAndDecodePathname('/path/%25');
		assert.equal(decoded, '/path/%');
	});

	it('allows %25 followed by a single hex digit then non-hex', () => {
		const decoded = validateAndDecodePathname('/path/%25Fx');
		assert.equal(decoded, '/path/%Fx');
	});

	it('allows encodeURIComponent output for filenames with special chars', () => {
		const decoded = validateAndDecodePathname('/files/100%25%20done%3F.txt');
		assert.equal(decoded, '/files/100% done%3F.txt');
	});

	// #endregion
	// #region Double-encoded brackets (Sanity Studio use case, issue #16960)

	it('fully decodes double-encoded brackets: %255B and %255D', () => {
		// %255B → %5B → [, %255D → %5D → ]
		assert.equal(validateAndDecodePathname('/sections%255B_key%255D'), '/sections[_key]');
	});

	// #endregion
	// #region Invalid encoding (malformed, must throw generic Error)

	it('throws generic Error for malformed percent-encoding', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%GG'),
			(err: any) => {
				assert.equal(err instanceof Error, true);
				return true;
			},
			'%GG is malformed encoding',
		);
	});

	it('throws generic Error for truncated percent-encoding', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%6'),
			(err: any) => {
				assert.equal(err instanceof Error, true);
				return true;
			},
			'%6 is truncated',
		);
	});
	// #endregion
});
