import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/compile-image-service/', import.meta.url);

describe('CompileImageService', () => {
	let wrangler;
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');

		wrangler = wranglerCli(fileURLToPath(root));
		await new Promise((resolve) => {
			wrangler.stdout.on('data', (data) => {
				// console.log('[stdout]', data.toString());
				if (data.toString().includes('http://127.0.0.1:8788')) resolve();
			});
			wrangler.stderr.on('data', (_data) => {
				// console.log('[stderr]', data.toString());
			});
		});
	});

	after(() => {
		wrangler.kill();
	});

	it('forbids http://', async () => {
		const res = await fetch('http://127.0.0.1:8788/_image?href=http://placehold.co/600x400');
		const html = await res.text();
		const status = res.status;
		assert.equal(html, 'Forbidden');
		assert.equal(status, 403);
	});

	it('forbids https://', async () => {
		const res = await fetch('http://127.0.0.1:8788/_image?href=https://placehold.co/600x400');
		const html = await res.text();
		const status = res.status;
		assert.equal(html, 'Forbidden');
		assert.equal(status, 403);
	});

	it('forbids //', async () => {
		const res = await fetch('http://127.0.0.1:8788/_image?href=//placehold.co/600x400');
		const html = await res.text();
		const status = res.status;
		assert.equal(html, 'Forbidden');
		assert.equal(status, 403);
	});

	it('allows trusted with redirect', async () => {
		const res = await fetch(
			'http://127.0.0.1:8788/_image?href=https://astro.build/_astro/HeroBackground.B0iWl89K_2hpsgp.webp',
			{ redirect: 'manual' },
		);
		const header = res.headers.get('location');
		const status = res.status;
		assert.equal(header, 'https://astro.build/_astro/HeroBackground.B0iWl89K_2hpsgp.webp');
		assert.equal(status, 302);
	});

	it('allows local', async () => {
		const res = await fetch('http://127.0.0.1:8788/_image?href=/_astro/placeholder.gLBdjEDe.jpg');
		const blob = await res.blob();
		const status = res.status;
		assert.equal(blob.type, 'image/jpeg');
		assert.equal(status, 200);
	});
});
