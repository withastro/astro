import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('build.format=file with dynamic routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dynamic-route-build-file',
			build: {
				format: 'file',
			},
		});
		await fixture.build();
	});

	it('Outputs a slug of undefined as the index.html', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('h1').text()).to.equal('Astro Store');
	});
});
