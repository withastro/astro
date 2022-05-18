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
	/**{
		url: '/privacy',
		h1: '[slug].astro',
		p: 'privacy'
	},
	{
		url: '/about',
		h1: '[slug].astro',
		p: 'about'
	},
	{
		url: '/about/contact',
		h1: '[...catchall].astro',
		p: 'about/contact'
	},*/
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

		routes.forEach(({ url, h1, p }) => {
			it(`matches ${url} to ${h1}`, async () => {
				const html = await fixture.readFile(url.endsWith('index.html') ? url : path.join(url, 'index.html'));
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal(h1);

				if (p) {
					expect($('p').text()).to.equal(p);
				}
			});
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

		routes.forEach(({ url, h1, p }) => {
			it(`matches ${url} to ${h1}`, async () => {
				const html = await fixture.fetch(url).then((res) => res.text());
				const $ = cheerioLoad(html);

				expect($('h1').text()).to.equal(h1);

				if (p) {
					expect($('p').text()).to.equal(p);
				}
			})
		});
	});
});
