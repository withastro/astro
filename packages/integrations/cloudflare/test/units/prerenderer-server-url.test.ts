import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, it } from 'node:test';
import { buildServerUrl } from '../../dist/utils/server-url.js';

/**
 * The end-to-end cases below bind to a single family on purpose. A server bound to
 * `::1` is genuinely unreachable at `127.0.0.1`, so a regression that went back to
 * re-stating a hostname would fail these rather than depending on how the host
 * running the suite happens to resolve `localhost`.
 */
describe('prerenderer server URL construction', () => {
	it('brackets IPv6 literals', () => {
		const url = buildServerUrl({ address: '::1', family: 'IPv6', port: 12345 } as AddressInfo);
		assert.equal(url, 'http://[::1]:12345');
	});

	it('leaves IPv4 literals bare', () => {
		const url = buildServerUrl({ address: '127.0.0.1', family: 'IPv4', port: 12345 } as AddressInfo);
		assert.equal(url, 'http://127.0.0.1:12345');
	});

	for (const [family, host] of [
		['IPv6', '::1'],
		['IPv4', '127.0.0.1'],
	] as const) {
		it(`reaches a server bound only to ${family}`, async () => {
			const server = http.createServer((_req, res) => {
				res.writeHead(200);
				res.end('ok');
			});
			await new Promise<void>((resolve) => server.listen(0, host, resolve));

			try {
				const address = server.address() as AddressInfo;
				assert.equal(address.family, family);

				const response = await fetch(buildServerUrl(address));
				assert.equal(response.status, 200);
				assert.equal(await response.text(), 'ok');
			} finally {
				await new Promise<void>((resolve) => server.close(() => resolve()));
			}
		});
	}
});
