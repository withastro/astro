import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../test-utils.js';

type Fixture = Awaited<ReturnType<typeof loadFixture>>;
type DevServer = NonNullable<Awaited<ReturnType<Fixture['startDevServer']>>>;

describe('vite-plugin-astro-server', () => {
	describe('url', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-request-url/',
				output: 'server',
			});
			const startedDevServer = await fixture.startDevServer();
			assert.ok(startedDevServer);
			devServer = startedDevServer;
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
