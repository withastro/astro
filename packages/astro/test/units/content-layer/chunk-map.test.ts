import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { chunkMap } from '../../../dist/content/data-store-writer.js';

describe('Content Layer - chunkMap', () => {
	it('splits a map into consecutive chunks of the given size', () => {
		const map = new Map([
			['a', 1],
			['b', 2],
			['c', 3],
			['d', 4],
		]);
		const chunks = chunkMap(map, 2);
		assert.equal(chunks.length, 2);
		assert.deepEqual(
			[...chunks[0]],
			[
				['a', 1],
				['b', 2],
			],
		);
		assert.deepEqual(
			[...chunks[1]],
			[
				['c', 3],
				['d', 4],
			],
		);
	});

	it('puts the remainder in a final smaller chunk', () => {
		const map = new Map([
			['a', 1],
			['b', 2],
			['c', 3],
			['d', 4],
			['e', 5],
		]);
		const chunks = chunkMap(map, 2);
		assert.equal(chunks.length, 3);
		assert.deepEqual(
			[...chunks[0]],
			[
				['a', 1],
				['b', 2],
			],
		);
		assert.deepEqual(
			[...chunks[1]],
			[
				['c', 3],
				['d', 4],
			],
		);
		assert.deepEqual([...chunks[2]], [['e', 5]]);
	});

	it('returns a single chunk when the map fits within the size', () => {
		const map = new Map([
			['a', 1],
			['b', 2],
			['c', 3],
		]);
		const chunks = chunkMap(map, 10);
		assert.equal(chunks.length, 1);
		assert.deepEqual(
			[...chunks[0]],
			[
				['a', 1],
				['b', 2],
				['c', 3],
			],
		);
	});

	it('emits no trailing empty chunk when the size equals the entry count', () => {
		// The running chunk reaches the size on the last entry and is pushed; the
		// function must not then push an extra empty chunk.
		const map = new Map([
			['a', 1],
			['b', 2],
			['c', 3],
		]);
		const chunks = chunkMap(map, 3);
		assert.equal(chunks.length, 1);
		assert.deepEqual(
			[...chunks[0]],
			[
				['a', 1],
				['b', 2],
				['c', 3],
			],
		);
	});

	it('returns no chunks for an empty map', () => {
		assert.deepEqual(chunkMap(new Map(), 3), []);
	});

	it('puts one entry per chunk when the size is one', () => {
		const map = new Map([
			['a', 1],
			['b', 2],
			['c', 3],
		]);
		const chunks = chunkMap(map, 1);
		assert.equal(chunks.length, 3);
		assert.deepEqual([...chunks[0]], [['a', 1]]);
		assert.deepEqual([...chunks[1]], [['b', 2]]);
		assert.deepEqual([...chunks[2]], [['c', 3]]);
	});

	it('preserves insertion order and key/value pairing across the split', () => {
		// Keys are intentionally unsorted; chunkMap must not reorder entries.
		const map = new Map([
			['delta', { n: 4 }],
			['alpha', { n: 1 }],
			['charlie', { n: 3 }],
			['bravo', { n: 2 }],
		]);
		const chunks = chunkMap(map, 3);
		assert.equal(chunks.length, 2);
		// Rejoining the chunks reproduces the original map exactly, in order.
		const rejoined = new Map(chunks.flatMap((chunk) => [...chunk]));
		assert.deepEqual([...rejoined], [...map]);
	});
});
