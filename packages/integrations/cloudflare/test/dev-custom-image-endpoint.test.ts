import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Dev custom image endpoint', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-custom-image-endpoint/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('transforms local images with the default dev endpoint', async () => {
		const html = await fixture.fetch('/').then((res) => res.text());
		const imagePath = /\/_image[^"',\s]+/.exec(html)?.[0];
		assert.ok(imagePath, html);
		const requestPath = imagePath.replaceAll('&amp;', '&');
		assert.match(requestPath, /\?/);
		assert.match(requestPath, /[?&]w=100\b/);

		const res = await fixture.fetch(requestPath);
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('content-type'), 'image/webp');
	});
});
