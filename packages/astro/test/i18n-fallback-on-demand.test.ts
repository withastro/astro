import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

function i18n(fallbackType: 'rewrite' | 'redirect') {
	return {
		locales: ['en', 'de'],
		defaultLocale: 'en',
		fallback: { de: 'en' },
		routing: { prefixDefaultLocale: false, fallbackType },
	};
}

// A locale-prefixed request for a page that only exists in the default locale
// reaches the page through one of its fallback routes. On-demand pages rendered
// this way must get the configured fallback, not a bodyful 302 without Location.
describe('i18n fallback for on-demand pages', () => {
	describe('with fallbackType: rewrite', () => {
		let fixture: Fixture;
		let app: App;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-fallback-on-demand/',
				outDir: './dist/i18n-fallback-on-demand-rewrite/',
				adapter: testAdapter(),
				i18n: i18n('rewrite'),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('serves the default locale page at the locale URL with status 200', async () => {
			const response = await app.render(new Request('http://example.com/de/live'));
			assert.equal(response.status, 200);
			assert.equal(response.headers.has('Location'), false);
			const $ = cheerio.load(await response.text());
			assert.equal($('#page').text(), 'live');
			assert.equal($('#locale').text(), 'de');
		});

		it('still returns 404 for a page missing in every locale', async () => {
			const response = await app.render(new Request('http://example.com/de/missing'));
			assert.equal(response.status, 404);
		});

		it('prerenders the fallback page', async () => {
			const $ = cheerio.load(await fixture.readFile('/client/de/index.html'));
			assert.equal($('#page').text(), 'index');
		});
	});

	describe('with fallbackType: redirect', () => {
		let fixture: Fixture;
		let app: App;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-fallback-on-demand/',
				outDir: './dist/i18n-fallback-on-demand-redirect/',
				adapter: testAdapter(),
				i18n: i18n('redirect'),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('redirects to the default locale page', async () => {
			const response = await app.render(new Request('http://example.com/de/live'));
			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/live');
		});

		it('prerenders a redirect to the default locale page', async () => {
			const html = await fixture.readFile('/client/de/index.html');
			assert.match(html, /<meta http-equiv="refresh" content="2;url=\/">/);
		});
	});
});
