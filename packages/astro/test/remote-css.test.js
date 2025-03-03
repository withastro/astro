import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

async function getCssContent($, fixture) {
	const contents = await Promise.all(
		$('link[rel=stylesheet][href^=/_astro/]').map((_, el) =>
			fixture.readFile(el.attribs.href.replace(/^\/?/, '/')),
		),
	);
	return contents.join('').replace(/\s/g, '').replace('/n', '');
}

describe('Remote CSS', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/remote-css/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Includes all styles on the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const css = await getCssContent($, fixture);

		assert.match(css, /https:\/\/unpkg.com\/open-props/);
		assert.match(css, /body/);
	});
});
