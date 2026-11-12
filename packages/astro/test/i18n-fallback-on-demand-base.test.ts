import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

function i18n(fallbackType: 'rewrite' | 'redirect') {
	return {
		defaultLocale: 'en',
		locales: ['en', 'de'],
		fallback: { de: 'en' },
		routing: { prefixDefaultLocale: false, fallbackType },
	};
}

for (const fallbackType of ['rewrite', 'redirect'] as const) {
	for (const base of ['/', '/docs/']) {
		describe(`on-demand fallback ${fallbackType} with base ${base}`, () => {
			let fixture: Fixture;
			let app: App;
			const prefix = base === '/' ? '' : '/docs';
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/i18n-fallback-on-demand/',
					output: 'server',
					base,
					adapter: testAdapter(),
					i18n: i18n(fallbackType),
					outDir: `./dist/matrix-${fallbackType}-${prefix ? 'base' : 'root'}/`,
				});
				await fixture.build();
				app = await fixture.loadTestAdapterApp();
			});

			it('serves or redirects the on-demand fallback and preserves search', async () => {
				const search = '?x=1&x=2&encoded=%2F%3F';
				const res = await app.render(new Request(`http://example.com${prefix}/de/live${search}`));
				if (fallbackType === 'redirect') {
					assert.equal(res.status, 302);
					assert.equal(res.headers.get('Location'), `${prefix}/live${search}`);
				} else {
					assert.equal(res.status, 200);
					assert.equal(res.headers.get('Location'), null);
					const $ = cheerio.load(await res.text());
					assert.equal($('#page').text(), 'live');
					assert.equal($('#path').text(), `${prefix}/live${prefix ? '/' : ''}`);
					assert.equal($('#search').text(), search);
				}
			});

			it('handles encoded filenames', async () => {
				const res = await app.render(new Request(`http://example.com${prefix}/de/caf%C3%A9?x=1`));
				if (fallbackType === 'redirect') {
					assert.equal(res.status, 302);
					assert.equal(res.headers.get('Location'), `${prefix}/caf%C3%A9?x=1`);
				} else {
					assert.equal(res.status, 200);
					assert.equal(
						cheerio
							.load(await res.text())('#page')
							.text(),
						'café',
					);
				}
			});

			it('preserves forbidden pages and explicit redirects', async () => {
				const forbidden = await app.render(new Request(`http://example.com${prefix}/de/forbidden`));
				assert.equal(forbidden.status, 403);
				assert.equal(
					cheerio
						.load(await forbidden.text())('#path')
						.text(),
					`${prefix}/de/forbidden`,
				);
				const redirected = await app.render(new Request(`http://example.com${prefix}/de/redirect`));
				assert.equal(redirected.status, 307);
				assert.equal(redirected.headers.get('Location'), '/login?return=%2Fde%2Flive');
			});

			it('does not change source routes or prerendered fallback files', async () => {
				const res = await app.render(new Request(`http://example.com${prefix}/live`));
				assert.equal(res.status, 200);
				const html = await fixture.readFile('/client/de/start/index.html');
				if (fallbackType === 'rewrite') assert.equal(cheerio.load(html)('#page').text(), 'start');
				else assert.match(html, /http-equiv="refresh"/);
			});

			if (fallbackType === 'rewrite') {
				it('keeps a genuinely missing page at 404 in rewrite mode', async () => {
					const res = await app.render(new Request(`http://example.com${prefix}/de/missing`));
					assert.equal(res.status, 404);
				});
			}
		});
	}
}
