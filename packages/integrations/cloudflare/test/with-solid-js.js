import {loadFixture, runCLI} from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from "cheerio";

describe('With SolidJS', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-solid-js/',
		});
		await fixture.build();
	});

	it('renders the solid component', async () => {
		const { ready, stop } = runCLI('./fixtures/with-solid-js/', { silent: true });

		try {
			await ready;

			let res = await fetch(`http://localhost:8787/`);
			expect(res.status).to.equal(200);
			let html = await res.text();
			let $ = cheerio.load(html);
			expect($('.solid').text()).to.equal('Solid Content');
		} finally {
			stop();
		}
	});
});
