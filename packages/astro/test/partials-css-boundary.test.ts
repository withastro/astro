import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Partials CSS propagation', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/partials-css-boundary/',
			outDir: './dist/partials-css-boundary/',
		});
		await fixture.build();
	});

	it('includes transitive CSS from partials imported as components in build output', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		let styles = $('style')
			.toArray()
			.map((el) => $(el).text())
			.join('\n');

		const stylesheetHrefs = $('link[rel="stylesheet"]')
			.toArray()
			.map((el) => $(el).attr('href'))
			.filter((href): href is string => !!href && href.startsWith('/_astro/'));

		for (const href of stylesheetHrefs) {
			styles += `\n${await fixture.readFile(href)}`;
		}

		assert.match(styles, /\.results-table\[data-astro-cid-/);
		assert.match(html, /results-table/);
	});
});
