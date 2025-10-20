import assert from 'node:assert';
import { astro2tsx } from '../../dist/core/astro2tsx.js';
import { extractStylesheets } from '../../dist/core/parseCSS.js';
import { describe, it } from 'node:test';

describe('parseCSS - Can find all the styles in an Astro file', () => {
	it('Can find all the styles in an Astro file, including nested tags', () => {
		const input = `<style>h1{color: blue;}</style><div><style>h2{color: red;}</style></div>`;
		const { ranges } = astro2tsx(input, 'file.astro');

		const styleTags = extractStylesheets(ranges.styles);

		assert.notStrictEqual(styleTags, undefined);
	});
});
