import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('Dev image endpoint', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-image-endpoint/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('returns 403 for missing href parameter', async () => {
		const res = await fixture.fetch('/_image?f=webp');
		assert.equal(res.status, 403);
	});

	it('returns 403 for disallowed remote images', async () => {
		const res = await fixture.fetch('/_image?href=https://example.com/image.jpg&f=webp');
		assert.equal(res.status, 403);
	});

	it('returns 400 for unsupported format', async () => {
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=tiff');
		const text = await res.text();
		assert.equal(res.status, 400);
		assert.ok(text.includes('Unsupported format'));
	});

	it('transforms local images to png', async () => {
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=png&w=100');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('content-type'), 'image/png');
	});

	it('transforms local images to webp', async () => {
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=webp&w=100');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('content-type'), 'image/webp');
	});

	it('transforms local images to avif', async () => {
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=avif&w=100');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('content-type'), 'image/avif');
	});
});
