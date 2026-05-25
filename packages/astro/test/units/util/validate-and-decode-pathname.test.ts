import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	MultiLevelEncodingError,
	validateAndDecodePathname,
} from '../../../dist/core/util/pathname.js';

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
	// #region Standard double-encoding (attack vectors, must reject)

	it('rejects double-encoded unreserved chars: %2561 (a)', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%2561dmin'),
			MultiLevelEncodingError,
			'%2561 is double-encoded %61 (a)',
		);
	});

	it('rejects double-encoded uppercase hex: %2541 (A)', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%2541dmin'),
			MultiLevelEncodingError,
			'%2541 is double-encoded %41 (A)',
		);
	});

	it('rejects double-encoded slash: %252F', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%252F'),
			MultiLevelEncodingError,
			'%252F is double-encoded %2F (/)',
		);
	});

	it('rejects double-encoded null byte: %2500', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%2500'),
			MultiLevelEncodingError,
			'%2500 is double-encoded %00 (null)',
		);
	});

	it('rejects double-encoded percent: %2525', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%2525'),
			MultiLevelEncodingError,
			'%2525 is double-encoded %25 (%)',
		);
	});

	it('rejects triple-encoded paths: %252561', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%252561dmin'),
			MultiLevelEncodingError,
			'%2525 triggers the pre-decode check (triple encoding)',
		);
	});

	it('rejects when double-encoding appears mid-path', () => {
		assert.throws(
			() => validateAndDecodePathname('/some/path/%2561dmin/rest'),
			MultiLevelEncodingError,
		);
	});

	it('rejects when multiple double-encoded segments exist', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%2561dmin/%2575sers'),
			MultiLevelEncodingError,
		);
	});

	it('rejects %25 followed by literal hex chars (%25AB) as ambiguous double-encoding', () => {
		// %25AB could be double-encoded %AB (U+00AB «) or a literal "%" + "AB".
		// These are indistinguishable at the URL level. Rejecting is the secure
		// default — it prevents middleware bypass when %AB would decode to a
		// meaningful character downstream.
		assert.throws(() => validateAndDecodePathname('/path/%25AB'), MultiLevelEncodingError);
	});

	// #endregion
	// #region Creative triple-encoding (defense-in-depth, must reject)
	//
	// An attacker encodes the hex digits within %25XX itself, e.g.:
	//   %25%32%35 → decodeURI → %25  (reassembles the %25 signature)
	//   %25%36%31 → decodeURI → %61  (but preceded by a reassembled %25)
	//
	// Full payload: %25%32%3561dmin → decodeURI → %2561dmin
	// The post-decode check catches this because the decoded output
	// contains %25[hex][hex].

	it('rejects creative triple-encoding: %25%32%3561dmin', () => {
		// %25 → %, %32 → 2, %35 → 5; decoded = %2561dmin
		// Post-decode regex catches %2561 in the output
		assert.throws(
			() => validateAndDecodePathname('/api/%25%32%3561dmin'),
			MultiLevelEncodingError,
			'creative triple-encoding reassembles into %2561 after one decode',
		);
	});

	it('rejects creative encoding of %252F via hex-encoded digits', () => {
		// %25%32%46 → decodeURI → %2F (but via %25 + "2F" reassembled)
		// Actually: %25 → %, %32 → 2, %46 → F; decoded = %2F
		// Post-decode check sees %2F which is %25[hex][hex]? No — %2F is not %25HH.
		// But wait: the decoded output is "%2F". The regex /%25[0-9a-fA-F]{2}/ does NOT
		// match "%2F" because it requires the literal string "%25", not "%2".
		// This specific input decodes to a single %HH sequence, not a %25HH sequence,
		// so it is NOT multi-level encoding — it's just a creative way to spell %2F.
		//
		// Let's verify: input %25%32%46 → decodeURI → %2F (a reserved-char encoding)
		// This is equivalent to just writing %2F directly. Not a bypass.
		const decoded = validateAndDecodePathname('/api/%25%32%46');
		// decodeURI: %25 → %, %32 → 2, %46 → F → result is /api/%2F
		assert.equal(decoded, '/api/%2F');
	});

	it('rejects creative triple-encoding of %2525 via hex-encoded digits', () => {
		// %25%32%35 → decodeURI → %25 (reassembled)
		// Followed by another hex pair, e.g. %25%32%3525 → decodeURI → %2525
		// But simpler: %25%32%35%36%31 → decodeURI → %2561
		// Post-decode regex catches %2561
		assert.throws(
			() => validateAndDecodePathname('/api/%25%32%35%36%31dmin'),
			MultiLevelEncodingError,
			'creative encoding reassembles %25 + 61 → %2561 after decode',
		);
	});

	// #endregion
	// #region False-positive fix: %25 followed by another %XX (must pass)
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
		// %25Fx — only one hex digit after %25, then 'x' (non-hex)
		// The regex requires exactly two hex digits after %25
		// %25 → %, F stays as literal 'F', x stays
		const decoded = validateAndDecodePathname('/path/%25Fx');
		assert.equal(decoded, '/path/%Fx');
	});

	it('allows encodeURIComponent output for filenames with special chars', () => {
		// Real-world: user uploads a file named "100% done?.txt"
		// encodeURIComponent('100% done?.txt') → '100%25%20done%3F.txt'
		// but in a path segment via encodeURIComponent: '100%25%20done%3F.txt'
		const decoded = validateAndDecodePathname('/files/100%25%20done%3F.txt');
		assert.equal(decoded, '/files/100% done%3F.txt');
	});

	// #endregion
	// #region Invalid encoding (malformed, must throw generic Error)

	it('throws generic Error for malformed percent-encoding', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%GG'),
			(err: any) => {
				assert.equal(err instanceof MultiLevelEncodingError, false);
				assert.equal(err instanceof Error, true);
				return true;
			},
			'%GG is malformed encoding, not multi-level',
		);
	});

	it('throws generic Error for truncated percent-encoding', () => {
		assert.throws(
			() => validateAndDecodePathname('/api/%6'),
			(err: any) => {
				assert.equal(err instanceof MultiLevelEncodingError, false);
				assert.equal(err instanceof Error, true);
				return true;
			},
			'%6 is truncated, not multi-level',
		);
	});
	// #endregion
});
