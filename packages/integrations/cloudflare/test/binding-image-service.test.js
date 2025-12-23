import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('BindingImageService', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/binding-image-service/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
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
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=png');
		const text = await res.text();
		assert.equal(res.status, 400);
		assert.ok(text.includes('not supported'));
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
