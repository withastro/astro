import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';

import { Logger } from '../dist/core/logger/core.js';
import { testImageService } from './test-image-service.js';
import { loadFixture } from './test-utils.js';

describe('astro:image:infersize', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	const remoteAvatarUrl = 'https://avatars.githubusercontent.com/u/622227?s=64&v=4';

	describe('dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-infersize/',
			});

			devServer = await fixture.startDevServer({
				logger: new Logger({
					level: 'error',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						},
					}),
				}),
			});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('inferSize works', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Image component works', async () => {
				let $img = $('img');
				assert.equal(
					$img.attr('src').startsWith('/_image') && $img.attr('src').endsWith('f=webp'),
					true,
				);
			});

			it('Picture component works', async () => {
				let $img = $('picture img');
				assert.equal(
					$img.attr('src').startsWith('/_image') && $img.attr('src').endsWith('f=png'),
					true,
				);
			});

			it('getImage works', async () => {
				let $img = $('#getImage');
				assert.equal(
					$img.attr('src').startsWith('/_image') && $img.attr('src').endsWith('f=webp'),
					true,
				);
			});

			it('direct function call work', async () => {
				let $dimensions = $('#direct');
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
		/** @type {import('./test-utils').Fixture} */
		let customFixture;
		/** @type {import('./test-utils').DevServer} */
		let customDevServer;

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
