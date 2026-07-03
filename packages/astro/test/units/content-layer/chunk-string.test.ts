import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { chunkString } from '../../../dist/content/data-store-writer.js';

/**
 * Encode to UTF-8 bytes and decode back, simulating what happens when a part is
 * written to disk and read back. If a part contained half of a surrogate pair,
 * the encode step would substitute U+FFFD and this round-trip would no longer
 * equal the original part.
 */
function utf8RoundTrip(str: string): string {
	return new TextDecoder().decode(new TextEncoder().encode(str));
}

function utf8ByteLength(str: string): number {
	return new TextEncoder().encode(str).length;
}

describe('Content Layer - chunkString', () => {
	it('splits ASCII on exact byte boundaries', () => {
		const parts = chunkString('abcdefghij', 4);
		assert.deepEqual(parts, ['abcd', 'efgh', 'ij']);
		assert.equal(parts.join(''), 'abcdefghij');
	});

	it('returns no parts for an empty string', () => {
		assert.deepEqual(chunkString('', 10), []);
	});

	it('keeps every part within the byte limit', () => {
		const str = 'a£好😀bçdéf😀g好';
		const maxBytes = 5;
		const parts = chunkString(str, maxBytes);
		for (const part of parts) {
			assert.ok(
				utf8ByteLength(part) <= maxBytes,
				`part ${JSON.stringify(part)} is ${utf8ByteLength(part)} bytes, over the ${maxBytes} limit`,
			);
		}
		assert.equal(parts.join(''), str);
	});

	it('never splits an astral-plane character across parts', () => {
		// U+1F600 is 4 UTF-8 bytes and a surrogate pair (2 UTF-16 code units).
		const str = '😀'.repeat(8);
		const maxBytes = 10; // holds two emoji (8 bytes) but not three (12 bytes)
		const parts = chunkString(str, maxBytes);

		for (const part of parts) {
			assert.ok(utf8ByteLength(part) <= maxBytes);
			// The part survives a UTF-8 write/read round-trip unchanged, which is
			// only true if it contains whole code points (no lone surrogate).
			assert.equal(utf8RoundTrip(part), part);
		}
		// Rejoining the round-tripped parts reproduces the original exactly.
		assert.equal(parts.map(utf8RoundTrip).join(''), str);
	});

	it('emits a single code point that exceeds the limit as its own part', () => {
		// A 4-byte code point with a 1-byte budget must still be emitted whole,
		// rather than dropped or split into an empty part.
		const parts = chunkString('😀', 1);
		assert.deepEqual(parts, ['😀']);
	});
});
