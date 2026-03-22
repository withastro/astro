import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro.params in static mode', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-params/',
		});
		await fixture.build();
	});

	it('It creates files that have square brackets in their URL', async () => {
		const html = await fixture.readFile(encodeURI('/[page]/index.html'));
		const $ = cheerio.load(html);
		assert.equal($('.category').text(), '[page]');
	});

	it("It doesn't encode/decode URI characters such as %23 (#)", async () => {
		const html = await fixture.readFile(encodeURI('/%23something/index.html'));
		const $ = cheerio.load(html);
		assert.equal($('.category').text(), '%23something');
	});

	it("It doesn't encode/decode URI characters such as %2F (/)", async () => {
		const html = await fixture.readFile(encodeURI('/%2Fsomething/index.html'));
		const $ = cheerio.load(html);
		assert.equal($('.category').text(), '%2Fsomething');
	});

	it("It doesn't encode/decode URI characters such as %3F (?)", async () => {
		const html = await fixture.readFile(encodeURI('/%3Fsomething/index.html'));
		const $ = cheerio.load(html);
		assert.equal($('.category').text(), '%3Fsomething');
	});
});
