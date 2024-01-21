import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';

describe('Basics', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
		});
		await fixture.build();
	});

	it('Alpine is working', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		expect($('#foo').text()).to.eq('bar');
	});
});
