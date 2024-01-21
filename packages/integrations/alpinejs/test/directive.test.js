import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';

describe('Directive', () => {
	/** @type {import('./test-utils.js.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/directive/',
		});
		await fixture.build();
	});

	it('Alpine directive is working', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		expect($('#foo').text()).to.eq('bar');
	});
});
