// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

const root = './fixtures/astro-envs/';

describe('Environment Variables', () => {
	describe('Build', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			process.env.BOOLEAN_VAR = 'true';
			process.env.NUMBER_VAR = '1';
			fixture = await loadFixture({ root });
			await fixture.build({});
		});

		after(() => {
			delete process.env.BOOLEAN_VAR;
			delete process.env.NUMBER_VAR;
		});

		it('builds without throwing', async () => {
			assert.equal(true, true);
		});

		it('does render public env and private env', async () => {
			let indexHtml = await fixture.readFile('/index.html');

			assert.equal(indexHtml.includes('CLUB_33'), true);
			assert.equal(indexHtml.includes('BLUE_BAYOU'), true);
		});

		it('does render destructured public env and private env', async () => {
			let indexHtml = await fixture.readFile('/destructured/index.html');

			assert.equal(indexHtml.includes('CLUB_33'), true);
			assert.equal(indexHtml.includes('BLUE_BAYOU'), true);
		});

		it('does render builtin SITE env', async () => {
			let indexHtml = await fixture.readFile('/index.html');
			assert.equal(indexHtml.includes('http://example.com'), true);
		});

		it('does render destructured builtin SITE env', async () => {
			let indexHtml = await fixture.readFile('/destructured/index.html');

			assert.equal(indexHtml.includes('http://example.com'), true);
		});

		it('does render builtin BASE_URL env', async () => {
			let indexHtml = await fixture.readFile('/index.html');
			assert.equal(indexHtml.includes('/blog'), true);
		});

		it('includes public env in client-side JS', async () => {
			let dirs = await fixture.readdir('/_astro');
			let found = false;

			// Look in all of the .js files to see if the public env is inlined.
			// Testing this way prevents hardcoding expected js files.
			// If we find it in any of them that's good enough to know its working.
			await Promise.all(
				dirs.map(async (path) => {
					if (path.endsWith('.js')) {
						let js = await fixture.readFile(`/_astro/${path}`);
						if (js.includes('BLUE_BAYOU')) {
							found = true;
						}
					}
				}),
			);

			assert.equal(found, true, 'found the public env variable in the JS build');
		});

		it('does not include private env in client-side JS', async () => {
			let dirs = await fixture.readdir('/');
			let found = false;

			// Look in all of the .js files to see if the public env is inlined.
			// Testing this way prevents hardcoding expected js files.
			// If we find it in any of them that's good enough to know it's NOT working.
			await Promise.all(
				dirs.map(async (path) => {
					if (path.endsWith('.js')) {
						let js = await fixture.readFile(`/${path}`);
						if (js.includes('CLUB_33')) {
							found = true;
						}
					}
				}),
			);

			assert.equal(found, false, 'found the private env variable in the JS build');
		});

		it('does not coerce environment variable values when experimental.staticImportMetaEnv is true', async () => {
			let indexHtml = await fixture.readFile('/index.html');
			assert.equal(indexHtml.includes('typeof BOOLEAN_VAR is string'), true);
			assert.equal(indexHtml.includes('typeof NUMBER_VAR is string'), true);
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			fixture = await loadFixture({ root });
			devServer = await fixture.startDevServer();
		});
		after(async () => {
			await devServer.stop();
		});

		it('does render builtin BASE_URL env', async () => {
			let res = await fixture.fetch('/blog/');
			assert.equal(res.status, 200);
			let indexHtml = await res.text();
			let $ = cheerio.load(indexHtml);
			assert.equal($('#base-url').text(), '/blog');
		});

		it('does render destructured builtin SITE env', async () => {
			let res = await fixture.fetch('/blog/destructured/');
			assert.equal(res.status, 200);
			let indexHtml = await res.text();
			let $ = cheerio.load(indexHtml);
			assert.equal($('#base-url').text(), '/blog');
		});

		it('does not inject env into imported asset files', async () => {
			let res = await fixture.fetch('/blog/');
			assert.equal(res.status, 200);
			let indexHtml = await res.text();
			let $ = cheerio.load(indexHtml);
			assert.equal($('#env').text(), 'A MYSTERY');
			assert.equal($('#css').text(), 'good');
		});
	});

	describe('SSR', () => {
		/** @type {import('./test-utils').App} */
		let app;

		before(async () => {
			const fixture = await loadFixture({
				root,
				output: 'server',
				adapter: testAdapter(),
			});
			process.env.SECRET_PLACE = 'SECRET_PLACE_BUILD';
			await fixture.build({});
			process.env.SECRET_PLACE = 'SECRET_PLACE_SSR';
			app = await fixture.loadTestAdapterApp();
		});

		after(async () => {
			delete process.env.SECRET_PLACE;
		});

		it('does not turn import.meta.env into process.env when experimental.staticImportMetaEnv is true', async () => {
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			assert.equal(html.includes('SECRET_PLACE_BUILD'), true);
		});
	});
});
