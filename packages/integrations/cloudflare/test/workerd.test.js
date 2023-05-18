import { expect } from 'chai';
import { loadFixture, runWorkerd } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('workerd static file', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/workerd/',
		});
		await fixture.build();
	});

	it('can render', async () => {
		const { ready, stop } = runWorkerd('./fixtures/workerd', { silent: false });

		try {
			await ready;

			let res = await fetch(`http://localhost:8080/`);
			expect(res.status).to.equal(200);
			let html = await res.text();
			let $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Testing');
			expect($('img').attr('src')).to.equal('/static.svg');

			res = await fetch(`http://localhost:8080/static.svg`);
			expect(res.status).to.equal(200);
			let svg = await res.text();
			$ = cheerio.load(svg);
			expect($('text').text()).to.equal("I'm Static");

		} finally {
			stop();
		}
	});
});
