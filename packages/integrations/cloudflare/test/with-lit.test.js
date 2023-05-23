import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from "cheerio";

describe('With Lit', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-lit/',
		});
		await fixture.build();
	});

	it('renders the lit component', async () => {
		const { ready, stop } = runCLI('./fixtures/with-lit/', { silent: true, port: 5005 });

		try {
			await ready;

			let res = await fetch(`http://localhost:5005/`);
			expect(res.status).to.equal(200);
			let html = await res.text();
			let $ = cheerio.load(html);
			expect($('.link-card').text().trim()).to.equal('Lit Content');
		} finally {
			stop();
		}
	});
});