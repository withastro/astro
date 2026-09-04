import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Cache provider waitUntil', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-provider-wait-until/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('passes Cloudflare waitUntil through to CacheProvider.onRequest', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal($('#has-cf-waituntil').text(), 'true');
		assert.equal(res.headers.get('x-cache-provider-waituntil'), 'function');
	});
});
