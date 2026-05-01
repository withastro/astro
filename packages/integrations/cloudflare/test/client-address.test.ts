import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

/**
 * Tests that the Cloudflare adapter correctly extracts and validates
 * clientAddress from the cf-connecting-ip header, ensuring:
 * - Only the first value is returned from multi-value headers
 * - The value is validated as a syntactically valid IP address
 * - Injection payloads are rejected
 *
 * Regression test for: https://github.com/withastro/astro-security/issues/69
 */
describe('Cloudflare clientAddress', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;
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

	it('rejects HTML injection in cf-connecting-ip', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': '<script>alert(1)</script>' },
		});
		assert.equal(res.status, 500);
	});

	it('rejects SQL injection in cf-connecting-ip', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': "'; DROP TABLE users; --" },
		});
		assert.equal(res.status, 500);
	});

	it('rejects path traversal in cf-connecting-ip', async () => {
		const res = await fixture.fetch('/api/address', {
			headers: { 'cf-connecting-ip': '../../etc/passwd' },
		});
		assert.equal(res.status, 500);
	});
});
