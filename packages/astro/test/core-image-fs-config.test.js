import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Image optimization with Vite fs config', () => {
	describe('fs.allow and fs.deny', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-fs-config/',
				vite: {
					server: {
						fs: {
							allow: [
								fileURLToPath(new URL('./fixtures/core-image-fs-config/outside', import.meta.url)),
							],
							deny: [
								fileURLToPath(
									new URL('./fixtures/core-image-fs-config-outside-denied', import.meta.url),
								),
							],
						},
					},
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('allows loading images from directories in fs.allow via /_image endpoint', async () => {
			// Get the absolute path to the allowed image
			const outsidePath = fileURLToPath(
				new URL('./fixtures/core-image-fs-config/outside/penguin-outside.jpg', import.meta.url),
			);
			const fsUrl = '/@fs/' + outsidePath.replace(/\\/g, '/');

			// Try to load the image via the /_image endpoint
			const imageUrl = `/_image?href=${encodeURIComponent(fsUrl)}&f=webp&w=300&h=200`;
			const response = await fixture.fetch(imageUrl);

			assert.equal(response.status, 200, 'Should successfully load image from fs.allow directory');
			assert.equal(response.headers.get('content-type'), 'image/webp', 'Should return webp format');
		});

		it('denies loading images from directories in fs.deny via /_image endpoint', async () => {
			// Get the absolute path to the denied image
			const deniedPath = fileURLToPath(
				new URL(
					'./fixtures/core-image-fs-config-outside-denied/penguin-denied.jpg',
					import.meta.url,
				),
			);
			const fsUrl = '/@fs/' + deniedPath.replace(/\\/g, '/');

			// Try to load the image via the /_image endpoint
			const imageUrl = `/_image?href=${encodeURIComponent(fsUrl)}&f=webp&w=300&h=200`;
			const response = await fixture.fetch(imageUrl);

			// Should fail because the directory is in fs.deny
			assert.notEqual(response.status, 200, 'Should deny access to image in fs.deny directory');
		});

		it('denies loading images from inside the project that are not in allow list', async () => {
			// Get the absolute path to an image that is IN the project but not in allow list
			// and not being imported (so not in safeModulePaths for this test)
			const projectPath = fileURLToPath(
				new URL('./fixtures/core-image-fs-config/src/sibling/penguin-sibling.jpg', import.meta.url),
			);
			const fsUrl = '/@fs/' + projectPath.replace(/\\/g, '/');

			// Try to load the image via the /_image endpoint
			const imageUrl = `/_image?href=${encodeURIComponent(fsUrl)}&f=webp&w=300&h=200`;
			const response = await fixture.fetch(imageUrl);

			// Should fail because it's not in the allow list (only 'outside' directory is allowed)
			// and it's not in safeModulePaths (not being imported in this test context)
			assert.notEqual(response.status, 200, 'Should deny access to project file not in allow list');
		});
	});

	describe('safeModulePaths', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-fs-config/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('allows imported images from sibling directory that are not in allow or deny (safeModulePaths)', async () => {
			// Even if a file is not technically allowed (ex: it's outside the project's folder), if a file is directly imported it'll be allowed to be loaded through /@fs urls
			const response = await fixture.fetch('/imported');
			assert.equal(response.status, 200, 'Page with imported sibling image should render');

			const html = await response.text();
			const $ = cheerio.load(html);

			const img = $('#sibling-image');
			assert.ok(img.length > 0, 'Image element should be present');

			const imgSrc = img.attr('src');
			assert.ok(imgSrc, 'Should have image src');
			assert.ok(imgSrc.includes('/_image'), 'Should use image optimization endpoint');

			// Try to fetch the optimized image
			const imgResponse = await fixture.fetch(imgSrc);
			assert.equal(imgResponse.status, 200, 'Optimized sibling image should be accessible');
		});
	});
});
