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
			getAllowedDomains: () => [],
		};
		const handler = createStandaloneHandler(
			app as any,
			{ client, server: server_, port: 0 } as any,
			undefined,
		);
		server = http.createServer(handler);
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		port = (server.address() as AddressInfo).port;
	});

	after(() => {
		server.close();
	});

	for (const path of ['/%C0%AF', '/?q=100%']) {
		it(`labels the 400 for undecodable URL ${path} as plain text`, async () => {
			const res = await fetch(`http://127.0.0.1:${port}${path}`);
			assert.equal(res.status, 400);
			assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
			assert.equal(await res.text(), 'Bad request.');
		});
	}
});
