import { expect } from 'chai';
import cheerio from 'cheerio';
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
		for (const file of ['/posts/optional-root-page/index.html', '/posts/optional-root-page/2/index.html', '/posts/optional-root-page/3/index.html']) {
			expect(await fixture.readFile(file)).to.be.ok;
		}
	});

	it('named root page', async () => {
		for (const file of ['/posts/named-root-page/1/index.html', '/posts/named-root-page/2/index.html', '/posts/named-root-page/3/index.html']) {
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
				expect($('#page-a').text()).to.equal(p);
				expect($('#page-b').text()).to.equal(p);
				expect($('#filter').text()).to.equal(color);
			})
		);
	});
});
