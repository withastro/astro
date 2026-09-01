import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { type AdapterServer, type Fixture, loadFixture, waitServerListen } from './test-utils.ts';

describe('keepAliveTimeout', () => {
	let fixture: Fixture;
	let server: AdapterServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/api-route/',
			adapter: nodejs({ mode: 'standalone', keepAliveTimeout: 65000 }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		server = startServer().server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
	});

	it('advertises the configured timeout to clients', async () => {
		// Asserted on the wire rather than on `server.keepAliveTimeout` so the whole path is
		// covered: the adapter option is serialized into the virtual config module at build
		// time, and only reaches the HTTP server through the built entrypoint. The header is
		// also what a reverse proxy actually reads.
		const agent = new http.Agent({ keepAlive: true });
		const keepAlive = await new Promise<string | undefined>((resolve, reject) => {
			const request = http.request(
				{ host: server.host, port: server.port, path: '/', agent },
				(response) => {
					response.resume();
					response.on('end', () => resolve(response.headers['keep-alive']));
				},
			);
			request.on('error', reject);
			request.end();
		});
		agent.destroy();

		assert.equal(keepAlive, 'timeout=65');
	});
});
