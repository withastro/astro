import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Must stay a file:// URL: a bare Windows path is rejected by dynamic import as an unknown scheme.
const lookupUrl = new URL('../../../dist/assets/utils/vendor/image-size/lookup.js', import.meta.url)
	.href;

const encoder = new TextEncoder();

describe('image-size SVG detection', () => {
	it('detects an SVG whose root tag ends after the first kilobyte', async () => {
		const { lookup } = await import(lookupUrl);
		// draw.io stores the editable diagram in the `content` attribute of the root tag.
		const content = 'x'.repeat(2000);
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="660" content="${content}"><rect width="10" height="10"/></svg>`;

		assert.deepEqual(lookup(encoder.encode(svg)), { height: 660, width: 900, type: 'svg' });
	});

	it('ignores a `>` inside a quoted attribute value after the first kilobyte', async () => {
		const { lookup } = await import(lookupUrl);
		const content = `${'x'.repeat(2000)}>`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" content='${content}' width="900" height="660"></svg>`;

		assert.deepEqual(lookup(encoder.encode(svg)), { height: 660, width: 900, type: 'svg' });
	});

	it('rejects a long input whose root tag is never closed', async () => {
		const { lookup } = await import(lookupUrl);
		// Every `<svg` is a candidate root tag, so detection must not rescan the input from each one.
		const input = encoder.encode('<svg '.repeat(100_000));

		assert.throws(() => lookup(input), TypeError);
	});

	it('does not detect text that only mentions an SVG tag after the first kilobyte', async () => {
		const { lookup } = await import(lookupUrl);
		const input = encoder.encode(`${' '.repeat(1000)}<svg width="1" height="1"></svg>`);

		assert.throws(() => lookup(input), TypeError);
	});
});
