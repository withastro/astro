import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import path from 'path';
import { loadFixture } from './test-utils.js';

let fixture;

const routes = [
	{
		url: '/',
		h1: 'index.astro'
	},
	{
		url: '/posts/post-1',
		h1: 'posts/[pid].astro',
		p: 'post-1'
	},
	{
		url: '/posts/post-2',
		h1: 'posts/[pid].astro',
		p: 'post-2'
	},
	{
		url: '/posts/1/2',
		h1: 'posts/[...slug].astro',
		p: '1/2'
	},
	{	
		url: '/de',
		h1: 'de/index.astro'
	},
	{
		url: '/de/',
		h1: 'de/index.astro'
	},
	{
		url: '/de/index.html',
		h1: 'de/index.astro'
	},
	{
		url: '/en',
		h1: '[lang]/index.astro',
		p: 'en'
	},
	{
		url: '/en/',
		h1: '[lang]/index.astro',
		p: 'en'
	},
	{
		url: '/en/index.html',
		h1: '[lang]/index.astro',
		p: 'en'
	},
	{
		url: '/de/1/2',
		h1: '[lang]/[...catchall].astro',
		p: 'de | 1/2'
	},
	{
		url: '/en/1/2',
		h1: '[lang]/[...catchall].astro',
		p: 'en | 1/2'
	}
]

describe('Routing priority', () => {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/routing-priority/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('matches / to index.astro', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('index.astro');
		});

		it('matches /posts/post-1 to posts/[pid].astro', async () => {
			const html = await fixture.readFile('/posts/post-1/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('posts/[pid].astro');
			expect($('p').text()).to.equal('post-1');
		});

		it('matches /posts/1/2 to posts/[...slug].astro', async () => {
			const html = await fixture.readFile('/posts/1/2/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('posts/[...slug].astro');
			expect($('p').text()).to.equal('1/2');
		});

		it('matches /de to de/index.astro', async () => {
			const html = await fixture.readFile('/de/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('de/index.astro');
		});

		it('matches /en to [lang]/index.astro', async () => {
			const html = await fixture.readFile('/en/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('[lang]/index.astro');
			expect($('p').text()).to.equal('en');
		});

		it('matches /de/1/2 to [lang]/[...catchall].astro', async () => {
			const html = await fixture.readFile('/de/1/2/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('[lang]/[...catchall].astro');
			expect($('p').text()).to.equal('de | 1/2')
		});

		it('matches /en/1/2 to [lang]/[...catchall].astro', async () => {
			const html = await fixture.readFile('/en/1/2/index.html');
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('[lang]/[...catchall].astro');
			expect($('p').text()).to.equal('en | 1/2')
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('matches / to index.astro', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('index.astro');
		});

		it('matches /posts/post-1 to /posts/[pid].astro', async () => {
			const html = await fixture.fetch('/posts/post-1').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('posts/[pid].astro');
				expect($('p').text()).to.equal('post-1');
		});

		it('matches /posts/1/2 to /posts/[...slug].astro', async () => {
			const html = await fixture.fetch('/posts/1/2').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('posts/[...slug].astro');
				expect($('p').text()).to.equal('1/2');
		});

		it('matches /de to de/index.astro', async () => {
			const html = await fixture.fetch('/de').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('de/index.astro');
		});

		it('matches /de to de/index.astro', async () => {
			const html = await fixture.fetch('/de').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('de/index.astro');
		});

		it('matches /de/ to de/index.astro', async () => {
			const html = await fixture.fetch('/de/').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('de/index.astro');
		});

		it('matches /de/index.html to de/index.astro', async () => {
			const html = await fixture.fetch('/de/index.html').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('de/index.astro');
		});

		it('matches /en to [lang]/index.astro', async () => {
			const html = await fixture.fetch('/en').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('[lang]/index.astro');
				expect($('p').text()).to.equal('en');
		});

		it('matches /en/ to [lang]/index.astro', async () => {
			const html = await fixture.fetch('/en/').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('[lang]/index.astro');
				expect($('p').text()).to.equal('en');
		});

		it('matches /en/index.html to de/index.astro', async () => {
			const html = await fixture.fetch('/en/index.html').then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal('[lang]/index.astro');
				expect($('p').text()).to.equal('en');
		});

		it('matches /de/1/2 to [lang]/[...catchall].astro', async () => {
			const html = await fixture.fetch('/de/1/2/index.html').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('[lang]/[...catchall].astro');
			expect($('p').text()).to.equal('de | 1/2');
		});

		it('matches /en/1/2 to [lang]/[...catchall].astro', async () => {
			const html = await fixture.fetch('/en/1/2/index.html').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('h1').text()).to.equal('[lang]/[...catchall].astro');
			expect($('p').text()).to.equal('en | 1/2');
		});
	});
});
