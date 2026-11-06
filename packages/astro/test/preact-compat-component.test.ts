import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Preact compat component', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/preact-compat-component/',
			outDir: './dist/preact-compat-component/',
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load Counter', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#counter-text').text(), '0');
		});
	});
});
