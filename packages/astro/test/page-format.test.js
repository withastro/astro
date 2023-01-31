import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('build.format', () => {
	describe('directory', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/page-format/',
			});
		});

		describe('Build', () => {
			before(async () => {
				await fixture.build();
			});

			it('relative urls created point to sibling folders', async () => {
				let html = await fixture.readFile('/nested/page/index.html');
				let $ = cheerio.load(html);
				expect($('#another').attr('href')).to.equal('/nested/page/another/');
			});
		});
	});

	describe('file', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/page-format/',
				build: {
					format: 'file',
				},
			});
		});

		describe('Build', () => {
			before(async () => {
				await fixture.build();
			});

			it('relative urls created point to sibling folders', async () => {
				let html = await fixture.readFile('/nested/page.html');
				let $ = cheerio.load(html);
				expect($('#another').attr('href')).to.equal('/nested/another/');
			});
		});
	});
});
