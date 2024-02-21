import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('SSR Astro.locals from server', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-locals/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Can access Astro.locals in page', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/foo');
		const locals = { foo: 'bar' };
		const response = await app.render(request, { locals });
		const html = await response.text();

		const $ = cheerio.load(html);
		assert.equal($('#foo').text(), 'bar');
	});

	it('Can access Astro.locals in api context', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/api');
		const locals = { foo: 'bar' };
		const response = await app.render(request, undefined, locals);
		assert.equal(response.status, 200);
		const body = await response.json();

		assert.equal(body.foo, 'bar');
	});
});
