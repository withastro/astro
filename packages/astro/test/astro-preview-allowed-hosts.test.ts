import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

/**
 * Make a raw HTTP request with a custom Host header.
 * Node's built-in fetch ignores Host header overrides, so we use node:http directly.
 * We also use the actual bound port from previewServer.server.address() to avoid
 * port mismatch if the configured port is already in use.
 */
function fetchWithHost(port: number, hostHeader: string): Promise<http.IncomingMessage> {
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
				res.resume(); // drain response body
				resolve(res);
			},
		);
		req.on('error', reject);
		req.end();
	});
}

function getBoundPort(previewServer: PreviewServer): number {
	// The public `PreviewServer` type hides `server`, but the static-preview-server
	// implementation we use here exposes it.
	const server = (previewServer as PreviewServer & { server: http.Server }).server;
	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('Expected preview server to be bound to a port');
	}
	return address.port;
}

describe('astro preview - allowedHosts via vite config', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-preview-allowed-hosts/',
			// Set allowedHosts via the vite.preview path (the broken path pre-fix)
			vite: {
				preview: {
					allowedHosts: ['example.com'],
				},
			},
			outDir: './dist/astro-preview-allowed-hosts-astro-preview-allowedhosts-via-vite-conf/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('allows requests from a host listed in vite.preview.allowedHosts', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'example.com');
		assert.equal(res.statusCode, 200);
	});

	it('blocks requests from a host not in vite.preview.allowedHosts', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'evil.com');
		assert.equal(res.statusCode, 403);
	});
});

describe('astro preview - allowedHosts true via vite config', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-preview-allowed-hosts/',
			outDir: './dist/allow-all/',
			// Set allowedHosts: true via the vite.preview path
			vite: {
				preview: {
					allowedHosts: true,
				},
			},
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('allows requests from any host when vite.preview.allowedHosts is true', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'any-host.example');
		assert.equal(res.statusCode, 200);
	});
});

describe('astro preview - server.allowedHosts takes precedence over vite.preview.allowedHosts', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-preview-allowed-hosts/',
			outDir: './dist/precedence/',
			// Astro server.allowedHosts should win over vite.preview.allowedHosts
			server: {
				allowedHosts: ['astro-wins.com'],
			},
			vite: {
				preview: {
					allowedHosts: ['vite-host.com'],
				},
			},
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('allows the host from server.allowedHosts', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'astro-wins.com');
		assert.equal(res.statusCode, 200);
	});

	it('blocks the host only in vite.preview.allowedHosts when server.allowedHosts is set', async () => {
		const res = await fetchWithHost(getBoundPort(previewServer), 'vite-host.com');
		assert.equal(res.statusCode, 403);
	});
});
