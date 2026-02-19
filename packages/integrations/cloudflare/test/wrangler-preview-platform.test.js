import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

describe('WranglerPreviewPlatform', () => {
	let fixture;
	let previewServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/wrangler-preview-platform/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		previewServer.stop();
	});

	it('exists', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasRuntime').text().includes('true'), true);
	});

	it('has environment variables', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasENV').text().includes('true'), true);
	});

	it('has Cloudflare request object', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasCF').text().includes('true'), true);
	});

	it('has Cloudflare cache', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasCACHES').text().includes('true'), true);
	});
});
