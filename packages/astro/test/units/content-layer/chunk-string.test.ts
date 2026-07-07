import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { chunkString } from '../../../dist/content/data-store-writer.js';

function decodeAndEncode(str: string): string {
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

	it('returns a single part when the whole string fits', () => {
		const parts = chunkString('café', 100);
		assert.deepEqual(parts, ['café']);
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
			assert.equal(decodeAndEncode(part), part);
		}
		// Rejoining the round-tripped parts reproduces the original exactly.
		assert.equal(parts.map(decodeAndEncode).join(''), str);
	});

	it('splits exactly at a surrogate-pair boundary', () => {
		const parts = chunkString('😀😀', 4);
		assert.deepEqual(parts, ['😀', '😀']);
	});

	it('budgets multi-byte BMP characters by their byte length', () => {
		const parts = chunkString('ñ€ñ€', 5);
		assert.deepEqual(parts, ['ñ€', 'ñ€']);
		for (const part of parts) {
			assert.equal(utf8ByteLength(part), 5);
		}
	});

	it('preserves interleaved BMP and astral characters across splits', () => {
		const str = 'a😀b好c𝕏d';
		const parts = chunkString(str, 5);
		for (const part of parts) {
			assert.ok(utf8ByteLength(part) <= 5);
			// No part holds a lone surrogate, so each survives a UTF-8 round-trip.
			assert.equal(decodeAndEncode(part), part);
		}
		assert.equal(parts.join(''), str);
	});

	it('rejoins a ZWJ emoji sequence split across parts', () => {
		const family = '👨‍👩‍👧‍👦';
		const parts = chunkString(family, 10);
		assert.ok(parts.length > 1, 'expected the sequence to be split across parts');
		for (const part of parts) {
			assert.ok(utf8ByteLength(part) <= 10);
			assert.equal(decodeAndEncode(part), part);
		}
		assert.equal(parts.map(decodeAndEncode).join(''), family);
	});

	it('emits a single code point that exceeds the limit as its own part', () => {
		const parts = chunkString('😀', 1);
		assert.deepEqual(parts, ['😀']);
	});
});
