import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Public dev with base', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let $;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/public-base-404/',
			site: 'http://example.com/',
			base: '/blog',
		});
		await fixture.startDevServer();
	});

	it('200 when loading /@vite/client', async () => {
		const response = await fixture.fetch('/@vite/client', {
			redirect: 'manual',
		});
		expect(response.status).to.equal(200);
		const content = await response.text();
		expect(content).to.contain('vite');
	});

	it('200 when loading /blog/twitter.png', async () => {
		const response = await fixture.fetch('/blog/twitter.png', {
			redirect: 'manual',
		});
		expect(response.status).to.equal(200);
	});

	it('custom 404 page when loading /blog/blog/', async () => {
		const response = await fixture.fetch('/blog/blog/');
		const html = await response.text();
		$ = cheerio.load(html);
		expect($('h1').text()).to.equal('404');
	});

	it('default 404 hint page when loading /', async () => {
		const response = await fixture.fetch('/');
		expect(response.status).to.equal(404);
		const html = await response.text();
		$ = cheerio.load(html);
		expect($('a').first().text()).to.equal('/blog/');
	});

	it('default 404 page when loading /none/', async () => {
		const response = await fixture.fetch('/none/', {
			headers: {
				accept: 'text/html,*/*',
			},
		});
		expect(response.status).to.equal(404);
		const html = await response.text();
		$ = cheerio.load(html);
		expect($('h1').text()).to.equal('404:  Not found');
		expect($('pre').text()).to.equal('Path: /none/');
	});
});
