import * as assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('BindingImageService', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;
	let redirectServer: Server;
	let redirectServerPort: number;

	before(async () => {
		// Start a local HTTP server that always responds with a 302 redirect.
		// Used to test that the image transform endpoint does not follow redirects.
		redirectServer = createServer((_req, res) => {
			res.writeHead(302, { Location: 'http://example.com/secret' });
			res.end();
		});
		await new Promise<void>((resolve) => {
			redirectServer.listen(0, () => {
				const address = redirectServer.address();
				if (typeof address === 'string' || !address) {
					throw new TypeError('Unexpected address for testing');
				}
				redirectServerPort = address.port;
				resolve();
			});
		});

		fixture = await loadFixture({
			root: './fixtures/binding-image-service/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await new Promise((resolve) => redirectServer.close(resolve));
	});

	it('returns 403 for missing href parameter', async () => {
		const res = await fixture.fetch('/_image?f=webp');
		assert.equal(res.status, 403);
	});

	it('returns 403 for remote images not in allowed domains', async () => {
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

	it('does not follow redirects for remote images', async () => {
		const href = `http://localhost:${redirectServerPort}/image.jpg`;
		const res = await fixture.fetch(`/_image?href=${encodeURIComponent(href)}&f=webp`);
		assert.equal(res.status, 404);
	});
});
