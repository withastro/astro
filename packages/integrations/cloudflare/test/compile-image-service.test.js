import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('CompileImageService', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/compile-image-service/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('forbids http://', async () => {
		const res = await fixture.fetch('/_image?href=http://placehold.co/600x400');
		const html = await res.text();
		const status = res.status;
		assert.equal(html, 'Forbidden');
		assert.equal(status, 403);
	});

	it('forbids https://', async () => {
		const res = await fixture.fetch('/_image?href=https://placehold.co/600x400');
		const html = await res.text();
		const status = res.status;
		assert.equal(html, 'Forbidden');
		assert.equal(status, 403);
	});

	it('forbids //', async () => {
		const res = await fixture.fetch('/_image?href=//placehold.co/600x400');
		const html = await res.text();
		const status = res.status;
		assert.equal(html, 'Blocked');
		assert.equal(status, 403);
	});

	it('allows trusted with redirect', async () => {
		const res = await fixture.fetch(
			'/_image?href=https://astro.build/_astro/HeroBackground.B0iWl89K_2hpsgp.webp',
			{ redirect: 'manual' },
		);
		const header = res.headers.get('location');
		const status = res.status;
		assert.equal(header, 'https://astro.build/_astro/HeroBackground.B0iWl89K_2hpsgp.webp');
		assert.equal(status, 302);
	});

	it('allows local', async () => {
		const res = await fixture.fetch('/_image?href=/_astro/placeholder.gLBdjEDe.jpg');
		const blob = await res.blob();
		const status = res.status;
		assert.equal(blob.type, 'image/jpeg');
		assert.equal(status, 200);
	});
});
