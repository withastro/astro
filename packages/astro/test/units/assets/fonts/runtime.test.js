// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGetFontBuffer, filterPreloads } from '../../../../dist/assets/fonts/runtime.js';

describe('fonts runtime', () => {
	describe('filterPreloads()', () => {
		it('returns null if it should not preload', () => {
			assert.equal(filterPreloads([], false), null);
		});

		it('returns everything if it should preload all', () => {
			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: undefined,
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: undefined,
						},
					],
					true,
				),
				[
					{
						style: 'normal',
						subset: undefined,
						type: 'woff2',
						url: 'foo',
						weight: undefined,
					},
					{
						style: 'italic',
						subset: 'latin',
						type: 'otf',
						url: 'bar',
						weight: undefined,
					},
				],
			);
		});

		it('returns filtered data', () => {
			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: undefined,
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: undefined,
						},
					],
					[
						{
							style: 'normal',
						},
					],
				),
				[
					{
						style: 'normal',
						subset: undefined,
						type: 'woff2',
						url: 'foo',
						weight: undefined,
					},
				],
			);
		});

		it('returns variable weight', () => {
			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: '500 900',
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: '100 900',
						},
					],
					[
						{
							weight: '400',
						},
					],
				),
				[
					{
						style: 'italic',
						subset: 'latin',
						type: 'otf',
						url: 'bar',
						weight: '100 900',
					},
				],
			);

			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: '500 900',
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: '100 900',
						},
					],
					[
						{
							weight: ' 100 900',
						},
					],
				),
				[
					{
						style: 'italic',
						subset: 'latin',
						type: 'otf',
						url: 'bar',
						weight: '100 900',
					},
				],
			);
		});
	});

	describe('createGetFontBuffer()', () => {
		it('throws if there is are no bufferImports', async () => {
			assert.rejects(() => createGetFontBuffer({ bufferImports: undefined })('foo'));
		});

		it('throws if hash cannot be found in buffer imports', async () => {
			assert.rejects(() =>
				createGetFontBuffer({
					bufferImports: {
						bar: async () => ({ default: Buffer.alloc(4) }),
					},
				})('foo'),
			);
		});

		it('throws if import fails', async () => {
			assert.rejects(() =>
				createGetFontBuffer({
					bufferImports: {
						foo: async () => {
							throw new Error('unexpected');
						},
					},
				})('foo'),
			);
		});

		it('throws if import result is not a buffer', async () => {
			assert.rejects(() =>
				createGetFontBuffer({
					bufferImports: {
						foo: async () => ({ default: null }),
					},
				})('foo'),
			);
		});

		it('works', async () => {
			const result = await createGetFontBuffer({
				bufferImports: {
					foo: async () => ({ default: Buffer.alloc(4) }),
				},
			})('foo');
			assert.equal(result instanceof Buffer, true);
		});
	});
});
