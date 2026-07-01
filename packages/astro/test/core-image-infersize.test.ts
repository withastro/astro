import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';

import { AstroLogger, type AstroLoggerMessage } from '../dist/core/logger/core.js';
import { testImageService } from './test-image-service.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:image:infersize', () => {
	let fixture: Fixture;
	const remoteAvatarUrl = 'https://avatars.githubusercontent.com/u/622227?s=64&v=4';

	describe('dev', () => {
		let devServer: DevServer;
		const logs: Array<AstroLoggerMessage> = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-infersize/',
				outDir: './dist/core-image-infersize-dev/',
			});

			const logger = new AstroLogger({
				level: 'error',
				destination: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			});
			devServer = await fixture.startDevServer({
				// @ts-expect-error: `_logger` is an internal API
				_logger: logger,
			});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('inferSize works', () => {
			let $: cheerio.CheerioAPI;
			before(async () => {
				const res = await fixture.fetch('/');
				const html = await res.text();
				$ = cheerio.load(html);
			});

			it('Image component works', async () => {
				const $img = $('img');
				assert.equal(
					$img.attr('src')!.startsWith('/_image') && $img.attr('src')!.endsWith('f=webp'),
					true,
				);
			});

			it('Picture component works', async () => {
				const $img = $('picture img');
				assert.equal(
					$img.attr('src')!.startsWith('/_image') && $img.attr('src')!.endsWith('f=png'),
					true,
				);
			});

			it('getImage works', async () => {
				const $img = $('#getImage');
				assert.equal(
					$img.attr('src')!.startsWith('/_image') && $img.attr('src')!.endsWith('f=webp'),
					true,
				);
			});

			it('direct function call work', async () => {
				const $dimensions = $('#direct');
				assert.equal($dimensions.text().trim(), '64x64');
			});
		});

		it('rejects remote inferSize that is not allowlisted', async () => {
			logs.length = 0;
			const res = await fixture.fetch('/disallowed');
			await res.text();

			const hasDisallowedLog = logs.some(
				(log) => log.message.includes('Remote image') && log.message.includes('not allowed'),
			);
			assert.equal(hasDisallowedLog, true);
		});
	});

	describe('dev inferSize retry', () => {
		// Enough PNG header metadata for dimension inference.
		const TINY_PNG_HEADER = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
			0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		]);

		let retryFixture: Fixture;
		let retryDevServer: DevServer | undefined;
		let remoteServer: Server | undefined;
		let remoteRequests = 0;

		before(async () => {
			remoteServer = createServer((req, res) => {
				remoteRequests++;
				if (remoteRequests <= 2) {
					req.socket.destroy();
					return;
				}

				res.writeHead(200, { 'Content-Type': 'image/png' });
				res.end(TINY_PNG_HEADER);
			});

			await new Promise<void>((resolve) => remoteServer!.listen(0, '127.0.0.1', resolve));

			const address = remoteServer.address();
			assert.ok(address && typeof address === 'object');

			process.env.ASTRO_REMOTE_IMAGE_RETRY_URL = `http://127.0.0.1:${address.port}/image.png`;
			retryFixture = await loadFixture({
				root: './fixtures/core-image-infersize/',
				image: {
					remotePatterns: [
						{
							protocol: 'http',
							hostname: '127.0.0.1',
							port: String(address.port),
						},
					],
				},
				outDir: './dist/core-image-infersize-dev-retry/',
			});

			retryDevServer = await retryFixture.startDevServer({});
		});

		after(async () => {
			delete process.env.ASTRO_REMOTE_IMAGE_RETRY_URL;
			await retryDevServer?.stop();

			if (remoteServer) {
				await new Promise<void>((resolve) => remoteServer!.close(() => resolve()));
			}
		});

		it('retries network errors when remote inferSize fetches dimensions', async () => {
			const res = await retryFixture.fetch('/retry');
			const html = await res.text();
			const $ = cheerio.load(html);
			const $img = $('#retry-image');

			assert.equal(remoteRequests, 3);
			assert.equal($img.attr('width'), '1');
			assert.equal($img.attr('height'), '1');
		});
	});

	describe('dev with custom image service', () => {
		let customFixture: Fixture;
		let customDevServer: DevServer;

		before(async () => {
			customFixture = await loadFixture({
				root: './fixtures/core-image-infersize/',
				image: {
					domains: ['avatars.githubusercontent.com'],
					service: testImageService({
						transform: { path: remoteAvatarUrl, scale: 2 },
					}),
				},
				outDir: './dist/core-image-infersize-dev-with-custom-image-service/',
			});

			customDevServer = await customFixture.startDevServer({});
		});

		after(async () => {
			await customDevServer.stop();
		});

		it('uses service.getRemoteSize for inferRemoteSize', async () => {
			const res = await customFixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			const dimensions = $('#direct').text().trim();
			assert.equal(dimensions, '128x128');
		});
	});
});
