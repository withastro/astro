import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Partials CSS propagation', () => {
	it('includes transitive CSS from partials imported as components in build output', async () => {
		const html = await fixture.readFile('/partials/index.html');
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
