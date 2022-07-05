import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Head in its own component', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-head/',
			site: 'https://mysite.dev/',
			base: '/blog',
		});
		await fixture.build();
	});

	it('Styles are appended to the head and not the body', async () => {
		let html = await fixture.readFile('/head-own-component/index.html');
		let $ = cheerio.load(html);
		expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1, 'one stylesheet overall');
		expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(1, 'stylesheet is in the head');
	});
});
