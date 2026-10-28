import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getWidths,
	getSizesAttribute,
	DEFAULT_RESOLUTIONS,
	LIMITED_RESOLUTIONS,
} from '../../../dist/assets/layout.js';

describe('getWidths', () => {
	const originalWidth = 2316;

	describe('constrained layout with LIMITED_RESOLUTIONS', () => {
		it('returns all breakpoints up to original width when width equals original', () => {
			const widths = getWidths({
				width: originalWidth,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [640, 750, 828, 1080, 1280, 1668, 2048, 2316]);
		});

		it('has max of 2x requested width', () => {
			const widths = getWidths({
				width: 800,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.equal(widths.at(-1), 1600);
		});

		it('returns just 1x and 2x when width is smaller than min breakpoint', () => {
			const widths = getWidths({
				width: 300,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [300, 600]);
		});

		it('caps at maxSize (min of 2x width, originalWidth)', () => {
			const widths = getWidths({
				width: 1500,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			// maxSize = min(3000, 2316) = 2316. Widths include 1500 (the width),
			// plus breakpoints <= 2316. 2560 is excluded.
			assert.ok(widths.includes(1500));
			assert.equal(widths.at(-1), 2048);
			assert.ok(!widths.includes(2560));
		});

		it('returns sorted widths', () => {
			const widths = getWidths({
				width: 800,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			for (let i = 1; i < widths.length; i++) {
				assert.ok(widths[i] >= widths[i - 1]);
			}
		});
	});

	describe('constrained layout with DEFAULT_RESOLUTIONS', () => {
		it('includes more breakpoints than LIMITED_RESOLUTIONS', () => {
			const widths = getWidths({
				width: originalWidth,
				layout: 'constrained',
				breakpoints: DEFAULT_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [640, 750, 828, 960, 1080, 1280, 1668, 1920, 2048, 2316]);
		});

		it('has max of 2x requested width', () => {
			const widths = getWidths({
				width: 800,
				layout: 'constrained',
				breakpoints: DEFAULT_RESOLUTIONS,
				originalWidth,
			});
			assert.equal(widths.at(-1), 1600);
		});

		it('returns just 1x and 2x when width is smaller than min breakpoint', () => {
			const widths = getWidths({
				width: 300,
				layout: 'constrained',
				breakpoints: DEFAULT_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [300, 600]);
		});
	});

	describe('fixed layout', () => {
		it('returns 1x and 2x the requested width', () => {
			const widths = getWidths({
				width: 800,
				layout: 'fixed',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [800, 1600]);
		});

		it('caps 2x at original width', () => {
			const widths = getWidths({
				width: 1500,
				layout: 'fixed',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [1500, 2316]);
		});

		it('returns only original width when requested width exceeds it', () => {
			const widths = getWidths({
				width: 3000,
				layout: 'fixed',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [2316]);
		});

		it('returns empty array when no width specified', () => {
			const widths = getWidths({
				layout: 'fixed',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, []);
		});
	});

	describe('full-width layout with LIMITED_RESOLUTIONS', () => {
		it('returns all breakpoints below original width', () => {
			const widths = getWidths({
				layout: 'full-width',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [640, 750, 828, 1080, 1280, 1668, 2048]);
		});

		it('ignores width parameter', () => {
			const widths = getWidths({
				width: 400,
				layout: 'full-width',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [640, 750, 828, 1080, 1280, 1668, 2048]);
		});
	});

	describe('full-width layout with DEFAULT_RESOLUTIONS', () => {
		it('returns all breakpoints below original width', () => {
			const widths = getWidths({
				layout: 'full-width',
				breakpoints: DEFAULT_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, [640, 750, 828, 960, 1080, 1280, 1668, 1920, 2048]);
		});
	});

	describe('full-width without originalWidth (remote images)', () => {
		it('returns all breakpoints when no originalWidth', () => {
			const widths = getWidths({
				layout: 'full-width',
				breakpoints: LIMITED_RESOLUTIONS,
			});
			assert.deepEqual(widths, LIMITED_RESOLUTIONS);
		});

		it('returns all DEFAULT_RESOLUTIONS when no originalWidth', () => {
			const widths = getWidths({
				layout: 'full-width',
				breakpoints: DEFAULT_RESOLUTIONS,
			});
			assert.deepEqual(widths, DEFAULT_RESOLUTIONS);
		});
	});

	describe('remote images (no originalWidth)', () => {
		it('constrained returns breakpoints up to 2x width', () => {
			const widths = getWidths({
				width: 800,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
			});
			assert.deepEqual(widths, [640, 750, 800, 828, 1080, 1280, 1600]);
		});

		it('constrained small returns 1x and 2x', () => {
			const widths = getWidths({
				width: 300,
				layout: 'constrained',
				breakpoints: LIMITED_RESOLUTIONS,
			});
			assert.deepEqual(widths, [300, 600]);
		});

		it('fixed returns 1x and 2x', () => {
			const widths = getWidths({
				width: 800,
				layout: 'fixed',
				breakpoints: LIMITED_RESOLUTIONS,
			});
			assert.deepEqual(widths, [800, 1600]);
		});
	});

	describe('edge cases', () => {
		it('defaults to DEFAULT_RESOLUTIONS when breakpoints not specified', () => {
			const widths = getWidths({
				layout: 'full-width',
				originalWidth: 10000,
			});
			assert.deepEqual(widths, DEFAULT_RESOLUTIONS);
		});

		it('returns empty array for unknown layout', () => {
			const widths = getWidths({
				width: 800,
				layout: 'none',
				breakpoints: LIMITED_RESOLUTIONS,
				originalWidth,
			});
			assert.deepEqual(widths, []);
		});
	});
});

describe('getSizesAttribute', () => {
	it('constrained: returns min-width media query', () => {
		assert.equal(
			getSizesAttribute({ width: 800, layout: 'constrained' }),
			'(min-width: 800px) 800px, 100vw',
		);
	});

	it('fixed: returns fixed width', () => {
		assert.equal(getSizesAttribute({ width: 400, layout: 'fixed' }), '400px');
	});

	it('full-width: returns 100vw', () => {
		assert.equal(getSizesAttribute({ width: 800, layout: 'full-width' }), '100vw');
	});

	it('none: returns undefined', () => {
		assert.equal(getSizesAttribute({ width: 800, layout: 'none' }), undefined);
	});

	it('returns undefined when width is missing', () => {
		assert.equal(getSizesAttribute({ layout: 'constrained' }), undefined);
	});

	it('returns undefined when layout is missing', () => {
		assert.equal(getSizesAttribute({ width: 800 }), undefined);
	});
});
