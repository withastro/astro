import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro.*', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-global/',
		});
	});

	describe('dev', () => {
		let devServer;
		let $;

		before(async () => {
			devServer = await fixture.startDevServer();
			const html = await fixture.fetch('/blog/?foo=42').then((res) => res.text());
			$ = cheerio.load(html);
		});

		after(async () => {
			await devServer.stop();
		});

		it('Astro.request.url', async () => {
			expect($('#pathname').text()).to.equal('/blog/');
			expect($('#searchparams').text()).to.equal('{}');
			expect($('#child-pathname').text()).to.equal('/blog/');
			expect($('#nested-child-pathname').text()).to.equal('/blog/');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Astro.request.url', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#pathname').text()).to.equal('/blog/');
			expect($('#searchparams').text()).to.equal('{}');
			expect($('#child-pathname').text()).to.equal('/blog/');
			expect($('#nested-child-pathname').text()).to.equal('/blog/');
		});

		it('Astro.canonicalURL', async () => {
			// given a URL, expect the following canonical URL
			const canonicalURLs = {
				'/index.html': 'https://mysite.dev/blog/',
				'/post/post/index.html': 'https://mysite.dev/blog/post/post/',
				'/posts/1/index.html': 'https://mysite.dev/blog/posts/',
				'/posts/2/index.html': 'https://mysite.dev/blog/posts/2/',
			};

			for (const [url, canonicalURL] of Object.entries(canonicalURLs)) {
				const html = await fixture.readFile(url);

				const $ = cheerio.load(html);
				expect($('link[rel="canonical"]').attr('href')).to.equal(canonicalURL);
			}
		});

		it('Astro.site', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#site').attr('href')).to.equal('https://mysite.dev/blog/');
		});

		it('Astro.glob() correctly returns an array of all posts', async () => {
			const html = await fixture.readFile('/posts/1/index.html');
			const $ = cheerio.load(html);
			expect($('.post-url').attr('href')).to.equal('/blog/post/post-2');
		});
	});
});
