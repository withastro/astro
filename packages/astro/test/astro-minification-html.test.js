import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, isWindows } from './test-utils.js';

describe('minification html', () => {
	let fixture;
	const regex = /[\r\n]+/gm;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/minification-html/' });
		await fixture.build();
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('validating the html is or not is minification ', async () => {
			const html = await fixture.readFile('/index.html');
			expect(regex.test(html.slice(20))).to.equal(false);
		});

	});
});
