import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Basic app', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
		});
		await fixture.build();
	});

	it('can render', async () => {
		const { ready, stop } = runCLI('./fixtures/basics/', { silent: true });

		try {
			await ready;

			let res = await fetch(`http://localhost:8787/`);
			expect(res.status).to.equal(200);
			let html = await res.text();
			let $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Testing');
		} finally {
			stop();
		}
	});
});
