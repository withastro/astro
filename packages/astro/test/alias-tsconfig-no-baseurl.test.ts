import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Aliases with tsconfig.json without baseUrl', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-tsconfig-no-baseurl/',
			outDir: './dist/alias-tsconfig-no-baseurl/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('can resolve paths without baseUrl', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Should render the content from @hello/world
			assert.equal($('h1').text(), 'world');
		});
	});
});
