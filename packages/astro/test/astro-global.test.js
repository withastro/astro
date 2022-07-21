import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Global', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-global/',
			site: 'https://mysite.dev/blog/',
			base: '/blog',
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

		it('Astro.glob() correctly returns meta info for MD and Astro files', async () => {
			const html = await fixture.readFile('/glob/index.html');
			const $ = cheerio.load(html);
			expect($('[data-file]').length).to.equal(3);
			expect($('.post-url[href]').length).to.equal(3);
		});
	});
});

describe('Astro Global Defaults', () => {
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
			expect($('#pathname').text()).to.equal('');
			expect($('#searchparams').text()).to.equal('');
			expect($('#child-pathname').text()).to.equal('');
			expect($('#nested-child-pathname').text()).to.equal('');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Astro.request.url', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#pathname').text()).to.equal('/');
			expect($('#searchparams').text()).to.equal('{}');
			expect($('#child-pathname').text()).to.equal('/');
			expect($('#nested-child-pathname').text()).to.equal('/');
		});

		it('Astro.site', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#site').attr('href')).to.equal(undefined);
		});
	});
});
