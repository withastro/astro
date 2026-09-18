import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getMarkdownCodeForImages } from '../../../dist/vite-plugin-markdown/images.js';

/**
 * Mirrors the decode chain used inside the generated code and in runtime.ts:
 * `&quot;`/`&#x22;` → `"`, `&apos;`/`&#x27;` → `'`, `&amp;`/`&#x26;` → `&`.
 * `&amp;` is decoded last to prevent double-decoding (e.g. `&amp;quot;` → `&quot;`).
 */
function decodeImageMarker(encoded: string): Record<string, unknown> {
	return JSON.parse(
		encoded
			.replace(/&(?:#x22|quot);/g, '"')
			.replace(/&(?:#x27|apos);/g, "'")
			.replace(/&(?:#x26|amp);/g, '&'),
	);
}

describe('getMarkdownCodeForImages', () => {
	it('generated code includes &amp; entity decoding', () => {
		const html = '<img __ASTRO_IMAGE_="test">';
		const code = getMarkdownCodeForImages([], [], html);
		// The generated JS must decode &amp;/&#x26; entities
		assert.ok(code.includes('&amp;'), 'generated code must include &amp; decode pattern');
		assert.ok(code.includes('#x26'), 'generated code must include &#x26; decode pattern');
	});
});

describe('image marker entity decoding', () => {
	it('decodes ampersands in alt and title (named entities from satteri)', () => {
		// Satteri encodes attribute values with named entities
		const encoded =
			'{&quot;alt&quot;:&quot;A &amp; B&quot;,&quot;title&quot;:&quot;C &amp; D&quot;,&quot;src&quot;:&quot;./img.png&quot;,&quot;index&quot;:0}';
		const result = decodeImageMarker(encoded);
		assert.equal(result.alt, 'A & B');
		assert.equal(result.title, 'C & D');
		assert.equal(result.src, './img.png');
	});

	it('decodes ampersands in alt and title (numeric entities from remark)', () => {
		// Remark encodes attribute values with numeric entities
		const encoded =
			'{&#x22;alt&#x22;:&#x22;A &#x26; B&#x22;,&#x22;src&#x22;:&#x22;./img.png&#x22;,&#x22;index&#x22;:0}';
		const result = decodeImageMarker(encoded);
		assert.equal(result.alt, 'A & B');
		assert.equal(result.src, './img.png');
	});

	it('preserves literal entity text like &quot; in values', () => {
		// If the user's alt text literally contains "&quot;", the HTML encodes
		// the & as &amp;, producing &amp;quot; in the attribute. Decoding &amp;
		// last yields the literal text "&quot;" — not a double-decoded quote.
		const encoded =
			'{&quot;alt&quot;:&quot;&amp;quot;&quot;,&quot;src&quot;:&quot;./img.png&quot;,&quot;index&quot;:0}';
		const result = decodeImageMarker(encoded);
		assert.equal(result.alt, '&quot;');
	});

	it('handles quotes and apostrophes in values', () => {
		// Apostrophe in alt text
		const encoded =
			'{&quot;alt&quot;:&quot;it&apos;s here&quot;,&quot;src&quot;:&quot;./img.png&quot;,&quot;index&quot;:0}';
		const result = decodeImageMarker(encoded);
		assert.equal(result.alt, "it's here");
	});

	it('handles values with no special characters', () => {
		const encoded =
			'{&quot;alt&quot;:&quot;plain text&quot;,&quot;src&quot;:&quot;./img.png&quot;,&quot;index&quot;:0}';
		const result = decodeImageMarker(encoded);
		assert.equal(result.alt, 'plain text');
	});

	it('handles multiple ampersands in one value', () => {
		const encoded =
			'{&quot;alt&quot;:&quot;A &amp; B &amp; C&quot;,&quot;src&quot;:&quot;./img.png&quot;,&quot;index&quot;:0}';
		const result = decodeImageMarker(encoded);
		assert.equal(result.alt, 'A & B & C');
	});
});
