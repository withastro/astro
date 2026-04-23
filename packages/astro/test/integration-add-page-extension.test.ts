import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.js';

describe('Integration addPageExtension', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/integration-add-page-extension/' });
		await fixture.build();
	});

	it('supports .mjs files', async () => {
		const html = await fixture.readFile('/test/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Hello world!');
	});
});
