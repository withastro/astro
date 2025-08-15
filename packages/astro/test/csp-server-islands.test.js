import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Server islands', () => {
	describe('SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-islands/ssr',
				adapter: testAdapter(),
				experimental: {
					csp: true,
				},
			});
		});

		describe('prod', () => {
			before(async () => {
				process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';
				await fixture.build();
			});

			after(async () => {
				delete process.env.ASTRO_KEY;
			});

			it('omits the islands HTML', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/');
				const response = await app.render(request);
				const html = await response.text();

				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);

				const serverIslandScript = $('script[data-island-id]');
				assert.equal(serverIslandScript.length, 1, 'has the island script');
			});

			it('island is not indexed', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						componentExport: 'default',
						encryptedProps: 'FC8337AF072BE5B1641501E1r8mLIhmIME1AV7UO9XmW9OLD',
						slots: {},
					}),
					headers: {
						origin: 'http://example.com',
					},
				});
				const response = await app.render(request);
				assert.equal(response.headers.get('x-robots-tag'), 'noindex');
			});
			it('omits empty props from the query string', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/empty-props');
				const response = await app.render(request);
				assert.equal(response.status, 200);
				const html = await response.text();
				const fetchMatch = html.match(/fetch\('\/_server-islands\/Island\?[^']*p=([^&']*)/);
				assert.equal(fetchMatch.length, 2, 'should include props in the query	string');
				assert.equal(fetchMatch[1], '', 'should not include encrypted empty props');
			});
			it('re-encrypts props on each request', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/includeComponentWithProps/');
				const response = await app.render(request);
				assert.equal(response.status, 200);
				const html = await response.text();
				const fetchMatch = html.match(
					/fetch\('\/_server-islands\/ComponentWithProps\?[^']*p=([^&']*)/,
				);
				assert.equal(fetchMatch.length, 2, 'should include props in the query	string');
				const firstProps = fetchMatch[1];
				const secondRequest = new Request('http://example.com/includeComponentWithProps/');
				const secondResponse = await app.render(secondRequest);
				assert.equal(secondResponse.status, 200);
				const secondHtml = await secondResponse.text();
				const secondFetchMatch = secondHtml.match(
					/fetch\('\/_server-islands\/ComponentWithProps\?[^']*p=([^&']*)/,
				);
				assert.equal(secondFetchMatch.length, 2, 'should include props in the query	string');
				assert.notEqual(
					secondFetchMatch[1],
					firstProps,
					'should re-encrypt props on each request with a different IV',
				);
			});
		});
	});

	describe('Hybrid mode', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-islands/hybrid',
				experimental: {
					csp: true,
				},
			});
		});

		describe('build', () => {
			before(async () => {
				await fixture.build({
					adapter: testAdapter(),
				});
			});

			it('Omits the island HTML from the static HTML', async () => {
				let html = await fixture.readFile('/client/index.html');

				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);

				const serverIslandScript = $('script[data-island-id]');
				assert.equal(serverIslandScript.length, 2, 'has the island script');
			});

			it('includes the server island runtime script once', async () => {
				let html = await fixture.readFile('/client/index.html');

				const $ = cheerio.load(html);
				const serverIslandScript = $('script').filter((_, el) =>
					$(el).html().trim().startsWith('async function replaceServerIsland'),
				);
				assert.equal(
					serverIslandScript.length,
					1,
					'should include the server island runtime script once',
				);
			});
		});

		describe('build (no adapter)', () => {
			it('Errors during the build', async () => {
				try {
					await fixture.build({
						adapter: undefined,
					});
					assert.equal(true, false, 'should not have succeeded');
				} catch (err) {
					assert.equal(err.title, 'Cannot use Server Islands without an adapter.');
				}
			});
		});
	});
});
