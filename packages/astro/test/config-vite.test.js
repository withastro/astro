import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vite Config', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/config-vite/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Allows overriding bundle naming options in the build', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.match($('link').attr('href'), /\/assets\/testing-[a-z\d]+\.css/);
	});
});
