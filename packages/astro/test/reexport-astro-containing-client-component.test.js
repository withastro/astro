import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Re-exported astro components with client components', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/reexport-astro-containing-client-component/' });
		await fixture.build();
	});

	it('Is able to build and renders and stuff', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('astro-island').length).to.equal(1);
		expect($('astro-island').attr('component-export')).to.equal('One');
	});
});
