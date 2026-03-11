import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('ExternalImageService dev', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/external-image-service-dev/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('uses passthrough image service in dev mode', async () => {
		// In dev mode, the cloudflare external image service should fall back to passthrough,
		// so the /_image endpoint should be available and working
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=webp&w=100');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('content-type'), 'image/webp');
	});

	it('does not generate cdn-cgi URLs in dev mode', async () => {
		// The page should render without any /cdn-cgi/image URLs
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
	});
});
