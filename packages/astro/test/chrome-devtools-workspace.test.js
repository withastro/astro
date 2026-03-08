import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Chrome DevTools workspace', () => {
	describe('with experimental flag enabled', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-dev-headers/',
				experimental: {
					chromeDevtoolsWorkspace: true,
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('serves Chrome DevTools workspace endpoint', async () => {
			const result = await fixture.fetch('/.well-known/appspecific/com.chrome.devtools.json');
			assert.equal(result.status, 200);
			assert.equal(result.headers.get('content-type'), 'application/json');

			const data = await result.json();
			assert.equal(data.workspace.version, '1.1');
			assert.equal(typeof data.workspace.uuid, 'string');
			assert.equal(data.workspace.uuid.length, 36); // UUID length
			assert.equal(typeof data.workspace.root, 'string');
			assert.ok(data.workspace.root.includes('astro-dev-headers'));
		});
	});

	describe('with experimental flag disabled', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-dev-headers/',
				experimental: {
					chromeDevtoolsWorkspace: false,
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('returns 404 for Chrome DevTools workspace endpoint', async () => {
			const result = await fixture.fetch('/.well-known/appspecific/com.chrome.devtools.json');
			assert.equal(result.status, 404);
		});
	});
});
