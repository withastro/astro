import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

/**
 * Tests that the Cloudflare adapter correctly extracts clientAddress from the
 * cf-connecting-ip header using getFirstForwardedValue(), ensuring only the
 * first value is returned when the header contains multiple comma-separated IPs.
 *
 * Regression test for: https://github.com/withastro/astro-security/issues/69
 */
describe('Cloudflare clientAddress', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/client-address/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		previewServer.stop();
	});

	it('returns the client IP from cf-connecting-ip header', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': '203.0.113.50' },
		});
		assert.equal(res.status, 200);
		const data = await res.json();
		assert.equal(data.clientAddress, '203.0.113.50');
	});

	it('returns only the first IP when cf-connecting-ip contains multiple values', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': '203.0.113.50, 70.41.3.18, 150.172.238.178' },
		});
		assert.equal(res.status, 200);
		const data = await res.json();
		assert.equal(data.clientAddress, '203.0.113.50');
	});

	it('trims whitespace around the IP address', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': '  203.0.113.50  ' },
		});
		assert.equal(res.status, 200);
		const data = await res.json();
		assert.equal(data.clientAddress, '203.0.113.50');
	});

	it('handles IPv6 addresses', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': '2001:db8::1' },
		});
		assert.equal(res.status, 200);
		const data = await res.json();
		assert.equal(data.clientAddress, '2001:db8::1');
	});

	it('renders the client address in an Astro page', async () => {
		const res = await fixture.fetch('/', {
			headers: { 'cf-connecting-ip': '198.51.100.42' },
		});
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#address').text(), '198.51.100.42');
	});

	it('renders only the first IP in an Astro page when header has multiple values', async () => {
		const res = await fixture.fetch('/', {
			headers: { 'cf-connecting-ip': '198.51.100.42, 10.0.0.1' },
		});
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#address').text(), '198.51.100.42');
	});
});
