import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';

describe('astro:env public variables', () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let fixture;
	/** @type {Awaited<ReturnType<(typeof fixture)["loadTestAdapterApp"]>>} */
	let app;

	describe('Server variables', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-env-server-secret/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('builds without throwing', async () => {
			assert.equal(true, true);
		});

		it('adapter can set how env is retrieved', async () => {
			const request = new Request('http://example.com/');
			app.setGetEnv((key) => {
				return {
					KNOWN_SECRET: '123456',
					UNKNOWN_SECRET: 'abc',
				}[key];
			});
			const response = await app.render(request);
			assert.equal(response.status, 200);

			const html = await response.text();
			const $ = cheerio.load(html);

			const data = JSON.parse($('#data').text());

			assert.equal(data.KNOWN_SECRET, 123456);
			assert.equal(data.UNKNOWN_SECRET, 'abc');
		});
	});
});
