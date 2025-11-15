// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterPreloads } from '../../../../dist/assets/fonts/runtime.js';

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
});
