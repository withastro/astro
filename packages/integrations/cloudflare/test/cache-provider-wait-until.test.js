import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

describe('Cache provider waitUntil', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-provider-wait-until/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		previewServer.stop();
	});

	it('passes Cloudflare waitUntil through to CacheProvider.onRequest', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal($('#has-cf-waituntil').text(), 'true');
		assert.equal(res.headers.get('x-cache-provider-waituntil'), 'function');
	});
});
