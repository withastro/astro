import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Asset URL resolution in build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('With site and base', async () => {
		describe('with site', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/asset-url-base/',
					site: 'http://example.com/sub/path/',
				});
				await fixture.build();
			});

			it("does not include the site's subpath", async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=stylesheet]').attr('href');
				expect(href.startsWith('/sub/path/')).to.equal(false);
			});
		});

		describe('with site and base', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/asset-url-base/',
					site: 'http://example.com/sub/path/',
					base: '/another/base/',
				});
				await fixture.build();
			});

			it("does not include the site's subpath", async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=stylesheet]').attr('href');
				expect(href.startsWith('/sub/path/')).to.equal(false);
			});

			it('does include the base subpath', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=stylesheet]').attr('href');
				expect(href.startsWith('/another/base/')).to.equal(true);
			});
		});
	});
});
