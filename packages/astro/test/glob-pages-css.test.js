import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro.glob on pages/ directory', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/glob-pages-css/',
		});
		await fixture.build();
	});

	it('It includes styles from child components', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);

		expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		
	});
});
