import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.js';

describe('vite-plugin-astro-server', () => {
	describe('url', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-request-url/',
				output: 'server',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('params are included', async () => {
			const res = await fixture.fetch('/url?xyz=123');
			assert.equal(res.status, 200);
			const html = await res.text();
			assert.ok(html.includes('/url?xyz=123'), 'URL should include query params');
		});

		it('params are excluded on prerendered routes', async () => {
			const res = await fixture.fetch('/prerendered?xyz=123');
			assert.equal(res.status, 200);
			const html = await res.text();
			assert.ok(html.includes('/prerendered'), 'URL should include pathname');
			assert.ok(!html.includes('xyz=123'), 'URL should not include query params');
		});
	});
});
