import assert from 'node:assert/strict';
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
				// @ts-expect-error: `logger` is an internal API
				logger,
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
