import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Collections API - renderEntry', () => {
	describe('Build - SSG', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
			});
			await fixture.build();
		});

		it('Page that render an entry include its CSS', async () => {
			const html = await fixture.readFile('/launch-week/index.html');
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});

		it('Page that does not render an entry does not include its CSS', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0);
		});
	});

	describe('Build - SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				output: 'server',
				root: './fixtures/content/',
				adapter: testAdapter()
			});
			await fixture.build();
		});

		it('Page that render an entry include its CSS', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/launch-week');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});

		it('Page that does not render an entry does not include its CSS', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0);
		});
	});
});
