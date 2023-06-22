import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe.skip('Basic app', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
		});
		await fixture.build();
	});

	it('can render', async () => {
		const { ready, stop } = runCLI('./fixtures/basics/', { silent: true, port: 8789 });

		try {
			await ready;

			let res = await fetch(`http://localhost:8789/`);
			expect(res.status).to.equal(200);
			let html = await res.text();
			let $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Testing');
			expect($('#env').text()).to.equal('secret');
		} finally {
			await stop();
		}
	});
});
