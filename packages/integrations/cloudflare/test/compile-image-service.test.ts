import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('CompileImageService', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/compile-image-service/',
		});
	});

	describe('dev', () => {
		let devServer: DevServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		// In dev, the compile service falls back to passthrough because sharp cannot run in workerd. Images are served unoptimized
		// through the /_image endpoint.
		it('returns 200 for local images via /_image endpoint', async () => {
			const html = await fixture.fetch('/blog/post').then((res) => res.text());
			const $ = cheerio.load(html);
			const src = $('img').attr('src')!;
			assert.ok(
				src.startsWith('/_image'),
				`Expected image src to route through /_image, got: ${src}`,
			);
			const res = await fixture.fetch(src);
			assert.equal(res.status, 200);
		});
	});

	describe('preview', () => {
		let previewServer: PreviewServer;
		before(async () => {
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

		it('allows local', async () => {
			const res = await fixture.fetch('/_image?href=/_astro/placeholder.gLBdjEDe.jpg&f=jpg');
			assert.equal(res.status, 200);
			const blob = await res.blob();
			assert.equal(blob.type, 'image/jpeg');
		});
	});
});

describe('CompileImageService custom service', () => {
	let fixture: Fixture;
	let html: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/compile-custom-image-service/',
			outDir: './dist/compile-custom-image-service/',
		});
		await fixture.build();
		html = await fixture.readFile('client/index.html');
	});

	it('uses the custom service for markup', () => {
		const $ = cheerio.load(html);
		const img = $('img');

		assert.equal(img.attr('data-image-service'), 'custom');
		assert.match(img.attr('src') ?? '', /^\/_astro\/.+\.webp$/);
	});

	it('uses the custom service for generated images', async () => {
		const $ = cheerio.load(html);
		const src = $('img').attr('src');
		assert.ok(src);

		const data = (await fixture.readFile(`client${src}`, null)) as unknown as Buffer;
		assert.equal(Buffer.from(data.subarray(0, 20)).toString('utf8'), 'CUSTOM_TRANSFORM_RAN');
	});
});
