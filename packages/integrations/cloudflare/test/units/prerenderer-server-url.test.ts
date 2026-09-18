import assert from 'node:assert/strict';
import http from 'node:http';
import { describe, it } from 'node:test';

/**
 * Mirrors the URL-construction logic in prerenderer.ts setup().
 * When the preview server binds to an IPv6 address, the URL must bracket
 * it so that fetch() connects to the same address listen() chose.
 */
function buildServerUrl(address: { address: string; family: string; port: number }): string {
	const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
	return `http://${host}:${address.port}`;
}

describe('prerenderer server URL construction', () => {
	it('brackets IPv6 loopback addresses', () => {
		const url = buildServerUrl({ address: '::1', family: 'IPv6', port: 12345 });
		assert.equal(url, 'http://[::1]:12345');
	});

	it('leaves IPv4 loopback addresses bare', () => {
		const url = buildServerUrl({ address: '127.0.0.1', family: 'IPv4', port: 12345 });
		assert.equal(url, 'http://127.0.0.1:12345');
	});

	it('connects to an IPv6-only server using the bound address', async () => {
		const server = http.createServer((_req, res) => {
			res.writeHead(200);
			res.end('ok');
		});

		await new Promise<void>((resolve) => server.listen(0, '::1', resolve));
		const address = server.address() as { address: string; family: string; port: number };

		assert.equal(address.address, '::1');
		assert.equal(address.family, 'IPv6');

		const url = buildServerUrl(address);
		const response = await fetch(url);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'ok');

		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	it('connects to an IPv4-only server using the bound address', async () => {
		const server = http.createServer((_req, res) => {
			res.writeHead(200);
			res.end('ok');
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address() as { address: string; family: string; port: number };

		assert.equal(address.address, '127.0.0.1');
		assert.equal(address.family, 'IPv4');

		const url = buildServerUrl(address);
		const response = await fetch(url);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'ok');

		await new Promise<void>((resolve) => server.close(() => resolve()));
	});
});
