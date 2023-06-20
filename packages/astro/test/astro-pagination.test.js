import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Pagination', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-pagination/',
			site: 'https://mysite.dev/',
			base: '/blog',
		});
		await fixture.build();
	});

	it('optional root page', async () => {
		for (const file of [
			'/posts/optional-root-page/index.html',
			'/posts/optional-root-page/2/index.html',
			'/posts/optional-root-page/3/index.html',
		]) {
			expect(await fixture.readFile(file)).to.be.ok;
		}
	});

	it('named root page', async () => {
		for (const file of [
			'/posts/named-root-page/1/index.html',
			'/posts/named-root-page/2/index.html',
			'/posts/named-root-page/3/index.html',
		]) {
			expect(await fixture.readFile(file)).to.be.ok;
		}
	});

	it('multiple params', async () => {
		const params = [
			{ color: 'red', p: '1' },
			{ color: 'blue', p: '1' },
			{ color: 'blue', p: '2' },
		];
		await Promise.all(
			params.map(async ({ color, p }) => {
				const html = await fixture.readFile(`/posts/${color}/${p}/index.html`);
				const $ = cheerio.load(html);
				expect($('#page-param').text()).to.equal(p);
				expect($('#currentPage').text()).to.equal(p);
				expect($('#filter').text()).to.equal(color);

				const prevHref = $('#prev').attr('href');
				const nextHref = $('#next').attr('href');

				if (color === 'red') {
					expect(prevHref).to.be.undefined;
					expect(nextHref).to.be.undefined;
				}
				if (color === 'blue' && p === '1') {
					expect(prevHref).to.be.undefined;
					expect(nextHref).to.equal('/posts/blue/2');
				}
				if (color === 'blue' && p === '2') {
					expect(prevHref).to.equal('/posts/blue/1');
					expect(nextHref).to.be.undefined;
				}
			})
		);
	});
});
