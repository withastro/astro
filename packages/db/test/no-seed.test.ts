import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('astro:db with no seed file', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/no-seed/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Prints the list of authors', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			const ul = $('.authors-list');
			assert.equal(ul.children().length, 5);
			assert.match(ul.children().eq(0).text(), /Ben/);
		});
	});
});
