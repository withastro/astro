import * as assert from 'node:assert/strict';
import { once } from 'node:events';
import { createConnection, type Socket } from 'node:net';
import { describe, it } from 'node:test';
import { createServer } from '../../dist/standalone.js';

describe('createServer', () => {
	it('stop() closes keep-alive, in-flight, and upgraded connections', async () => {
		const server = createServer(
			(req, res) => {
				if (req.url === '/stall') {
					res.write('partial');
					return;
				}
				res.end('ok');
			},
			'127.0.0.1',
			0,
		);
		server.server.on('upgrade', (_req, socket) => {
			socket.write(
				'HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: test\r\n\r\n',
			);
		});
		server.server.listen(0, '127.0.0.1');
		await once(server.server, 'listening');
		const address = server.server.address();
		assert.ok(address && typeof address === 'object');

		const sockets = await Promise.all([
			openConnection(address.port, 'GET / HTTP/1.1\r\nHost: x\r\nConnection: keep-alive\r\n\r\n'),
			openConnection(address.port, 'GET /stall HTTP/1.1\r\nHost: x\r\n\r\n'),
			openConnection(
				address.port,
				'GET / HTTP/1.1\r\nHost: x\r\nConnection: Upgrade\r\nUpgrade: test\r\n\r\n',
			),
		]);

		let timer: NodeJS.Timeout | undefined;
		const timeout = new Promise((_, reject) => {
			timer = setTimeout(() => reject(new Error('stop() did not resolve')), 2000);
		});
		try {
			await Promise.race([server.stop(), timeout]);
		} finally {
			clearTimeout(timer);
			for (const socket of sockets) socket.destroy();
		}
	});
});

function openConnection(port: number, request: string): Promise<Socket> {
	return new Promise((resolve, reject) => {
		const socket = createConnection(port, '127.0.0.1');
		socket.once('error', reject);
		socket.once('data', () => resolve(socket));
		socket.write(request);
	});
}
