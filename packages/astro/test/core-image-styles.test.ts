import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { testImageService } from './test-image-service.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Image styles injection', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/core-image-layout/',
			image: {
				service: testImageService({ foo: 'bar' }),
				domains: ['avatars.githubusercontent.com', 'images.unsplash.com'],
			},
			outDir: './dist/core-image-styles/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('injects a style tag with [data-astro-image] CSS', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);

		const style = $('style').text();
		assert.match(style, /\[data-astro-image\]/);
	});
});
