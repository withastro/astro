import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Multiple renderers', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/multiple-renderers/',
		});
		await fixture.build();
	});

	it('when the first throws but the second does not, use the second renderer', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#component')).to.have.a.lengthOf(1);
	});
});
