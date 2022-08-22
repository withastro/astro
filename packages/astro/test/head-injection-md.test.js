import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Head injection with markdown', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-injection-md/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('only injects head content once', async () => {
			const html = await fixture.readFile(`/index.html`);
			const $ = cheerio.load(html);

			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});
	});
});
