import * as assert from 'node:assert/strict';
import * as net from 'node:net';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture, waitServerListen, type AdapterServer } from './test-utils.ts';

describe('Aborted request body', () => {
	let fixture: Fixture;
	let server: AdapterServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/aborted-request/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
	});

	it('does not produce unhandled rejections when a client disconnects mid-body', async () => {
		const rejections: unknown[] = [];
		const handler = (reason: unknown) => {
			rejections.push(reason);
		};
		process.on('unhandledRejection', handler);

		try {
			const port = server.port;
			const host = server.host ?? 'localhost';

			// Send a POST with Content-Length: 100 but only 16 bytes of body,
			// then destroy the socket to simulate a client disconnect.
			await new Promise<void>((resolve) => {
				const socket = net.createConnection({ host, port }, () => {
					socket.write(
						'POST / HTTP/1.1\r\n' +
							`Host: ${host}:${port}\r\n` +
							'Content-Type: application/json\r\n' +
							'Content-Length: 100\r\n' +
							'\r\n' +
							'{"partial": true',
						() => {
							setTimeout(() => {
								socket.destroy();
								resolve();
							}, 50);
						},
					);
				});
				socket.on('error', () => resolve());
			});

			// Give the server time to process the aborted request.
			await new Promise((r) => setTimeout(r, 500));

			const econnresetRejections = rejections.filter(
				(r) =>
					r instanceof Error && 'code' in r && (r as NodeJS.ErrnoException).code === 'ECONNRESET',
			);
			assert.equal(
				econnresetRejections.length,
				0,
				'ECONNRESET should not surface as unhandled rejection',
			);
		} finally {
			process.removeListener('unhandledRejection', handler);
		}
	});

	it('still serves normal GET requests', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/`);
		assert.equal(res.status, 200);
		const text = await res.text();
		assert.ok(text.includes('ok'));
	});

	it('still serves complete POST requests', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ complete: true }),
		});
		assert.equal(res.status, 200);
		const text = await res.text();
		assert.ok(text.includes('ok'));
	});
});
