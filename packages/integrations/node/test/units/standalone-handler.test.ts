import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createStandaloneHandler } from '../../dist/standalone.js';

describe('createStandaloneHandler', () => {
	let server: http.Server;
	let port: number;

	before(async () => {
		const server_ = new URL('../../dist/', import.meta.url).href;
		const client = new URL('../../dist-client-missing/', import.meta.url).href;
		const app = {
			removeBase: (p: string) => p,
			match: () => undefined,
			manifest: { trailingSlash: 'ignore', buildFormat: 'directory', assetsDir: '_astro' },
		};
		const handler = createStandaloneHandler(
			app as any,
			{ client, server: server_, port: 0, host: '127.0.0.1', mode: 'standalone' } as any,
			undefined,
		);

		server = http.createServer(handler);
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		port = (server.address() as AddressInfo).port;
	});

	after(() => {
		server.close();
	});

	it('answers undecodable URLs with 400 and text/plain Content-Type', async () => {
		for (const badPath of ['/%C0%AF', '/?q=100%']) {
			const res = await fetch(`http://127.0.0.1:${port}${badPath}`);
			assert.equal(res.status, 400);
			assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
			assert.equal(await res.text(), 'Bad request.');
		}
	});
});
