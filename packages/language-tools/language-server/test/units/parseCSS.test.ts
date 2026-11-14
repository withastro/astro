import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astro2tsx } from '../../dist/core/astro2tsx.js';
import { extractStylesheets } from '../../dist/core/parseCSS.js';

describe('parseCSS - Can find all the styles in an Astro file', () => {
	it('Can find all the styles in an Astro file, including nested tags', () => {
		const input = `<style>h1{color: blue;}</style><div><style>h2{color: red;}</style></div>`;
		const { ranges } = astro2tsx(input, 'file.astro');

		const styleTags = extractStylesheets(ranges.styles);

		assert.strictEqual(styleTags.length, 1);
		assert.strictEqual(
			styleTags[0].snapshot.getText(0, styleTags[0].snapshot.getLength()),
			'h1{color: blue;}h2{color: red;}',
		);
		assert.deepStrictEqual(
			styleTags[0].mappings.map(({ generatedOffsets, lengths }) => ({ generatedOffsets, lengths })),
			[
				{ generatedOffsets: [0], lengths: [16] },
				{ generatedOffsets: [16], lengths: [15] },
			],
		);
	});

	it('includes style attribute wrappers in generated offsets', () => {
		const input = '<div style="color: red"></div>';
		const { ranges } = astro2tsx(input, 'file.astro');
		const [style] = extractStylesheets(ranges.styles);

		assert.strictEqual(
			style.snapshot.getText(0, style.snapshot.getLength()),
			'__ { color: red }\n',
		);
		assert.deepStrictEqual(style.mappings[0], {
			sourceOffsets: [input.indexOf('color: red')],
			generatedOffsets: [5],
			lengths: [10],
			data: {
				verification: false,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			},
		});
	});
});
