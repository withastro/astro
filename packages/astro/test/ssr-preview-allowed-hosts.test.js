import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

/**
 * Make a raw HTTP request with a custom Host header.
 * Node's built-in fetch ignores Host header overrides, so we use node:http directly.
 */
function fetchWithHost(port, hostHeader) {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				hostname: 'localhost',
				port,
				path: '/',
				method: 'GET',
				headers: { host: hostHeader },
			},
			(res) => {
				res.resume();
				resolve(res);
			},
		);
		req.on('error', reject);
		req.end();
	});
}

function getBoundPort(previewServer) {
	return previewServer.server.address().port;
}

describe('adapter preview - server.allowedHosts is passed to adapter', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-preview-allowed-hosts/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					previewEntrypoint: './preview.mjs',
				},
			}),
			server: {
				allowedHosts: ['example.com'],
			},
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('allows requests from a host listed in server.allowedHosts', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'example.com');
		// The SSR server build output doesn't serve static HTML, so we may get 404.
		// The important assertion is that it's NOT 403 (host validation passed).
		assert.notEqual(res.statusCode, 403);
	});

	it('blocks requests from a host not in server.allowedHosts', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'evil.com');
		assert.equal(res.statusCode, 403);
	});
});

describe('adapter preview - server.allowedHosts: true allows all hosts', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-preview-allowed-hosts/',
			outDir: './dist-allow-all/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					previewEntrypoint: './preview.mjs',
				},
			}),
			server: {
				allowedHosts: true,
			},
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('allows requests from any host when server.allowedHosts is true', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'any-host.example');
		assert.notEqual(res.statusCode, 403);
	});
});

describe('adapter preview - allowedHosts defaults to empty when not configured', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-preview-allowed-hosts/',
			outDir: './dist-default/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					previewEntrypoint: './preview.mjs',
				},
			}),
			// No server.allowedHosts configured — should default to []
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('allows localhost requests when no allowedHosts is configured', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'localhost');
		assert.notEqual(res.statusCode, 403);
	});
});
