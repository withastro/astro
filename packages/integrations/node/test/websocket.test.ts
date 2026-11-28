import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { type AdapterServer, type Fixture, loadFixture, waitServerListen } from './test-utils.ts';

/** Sends a raw upgrade request and resolves with the HTTP response or the 101 upgrade. */
function rawUpgrade(
	server: AdapterServer,
	path: string,
	headers: Record<string, string> = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
	return new Promise((resolve, reject) => {
		const req = http.request({
			host: server.host,
			port: server.port,
			path,
			headers: {
				Connection: 'Upgrade',
				Upgrade: 'websocket',
				'Sec-WebSocket-Version': '13',
				'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
				...headers,
			},
		});
		req.on('upgrade', (res, socket) => {
			socket.destroy();
			resolve({ status: res.statusCode!, headers: res.headers, body: '' });
		});
		req.on('response', async (res) => {
			let body = '';
			for await (const chunk of res) body += chunk;
			resolve({ status: res.statusCode!, headers: res.headers, body });
		});
		req.on('error', reject);
		req.end();
	});
}

function open(url: string, headers?: Record<string, string>): Promise<WebSocket> {
	// Node's WebSocket client accepts headers as a non-standard option.
	const socket = new WebSocket(url, headers ? ({ headers } as any) : undefined);
	return new Promise((resolve, reject) => {
		socket.addEventListener('open', () => resolve(socket), { once: true });
		socket.addEventListener('error', () => reject(new Error(`Could not connect to ${url}`)), {
			once: true,
		});
	});
}

function nextMessage(socket: WebSocket): Promise<MessageEvent> {
	return new Promise((resolve) =>
		socket.addEventListener('message', (event) => resolve(event), { once: true }),
	);
}

describe('WebSockets', () => {
	let fixture: Fixture;
	let server: AdapterServer;
	let base: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/websocket/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			server: { port: 4387 },
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		server = startServer().server;
		await waitServerListen(server.server);
		base = `ws://${server.host}:${server.port}`;
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
	});

	it('echoes text messages', async () => {
		const socket = await open(`${base}/echo`);
		socket.send('hello');
		assert.equal((await nextMessage(socket)).data, 'hello');
		socket.close();
	});

	it('echoes binary messages', async () => {
		const socket = await open(`${base}/echo`);
		socket.binaryType = 'arraybuffer';
		socket.send(new Uint8Array([1, 2, 3]));
		const { data } = await nextMessage(socket);
		assert.deepEqual([...new Uint8Array(data)], [1, 2, 3]);
		socket.close();
	});

	it('runs middleware before accepting the upgrade', async () => {
		const socket = await open(`${base}/echo`, { Cookie: 'user=ada' });
		socket.send('whoami');
		assert.equal((await nextMessage(socket)).data, 'ada');
		socket.close();
	});

	it('sends cookies set during the request in the handshake response', async () => {
		const res = await rawUpgrade(server, '/echo');
		assert.equal(res.status, 101);
		assert.ok(res.headers['set-cookie']?.some((cookie) => cookie.startsWith('seen=yes')));
	});

	it('sends the route response when the route does not upgrade', async () => {
		const res = await rawUpgrade(server, '/private');
		assert.equal(res.status, 401);
		assert.equal(res.body, 'Unauthorized');
	});

	it('opens the socket once the route accepts the upgrade', async () => {
		const socket = new WebSocket(`${base}/private`, { headers: { Cookie: 'user=ada' } } as any);
		assert.equal((await nextMessage(socket)).data, 'hello ada');
		socket.close();
	});

	it('handles non-upgrade requests to the same route normally', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/echo`);
		assert.equal(res.status, 426);
	});

	it('responds 404 to upgrade requests that match no route', async () => {
		const res = await rawUpgrade(server, '/missing');
		assert.equal(res.status, 404);
	});

	it('closes open sockets when the server stops', async () => {
		const socket = await open(`${base}/echo`);
		const closed = new Promise<CloseEvent>((resolve) =>
			socket.addEventListener('close', (event) => resolve(event), { once: true }),
		);
		await server.stop();
		assert.equal((await closed).wasClean, false);
		// Restart so `after` can stop it again.
		const { startServer } = await fixture.loadAdapterEntryModule();
		server = startServer().server;
		await waitServerListen(server.server);
	});
});

describe('WebSockets in middleware mode', () => {
	let fixture: Fixture;
	let server: http.Server;
	let base: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/websocket/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
		const { handler, upgradeHandler } = await fixture.loadAdapterEntryModule();
		server = http.createServer(handler);
		server.on('upgrade', upgradeHandler);
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const { port } = server.address() as AddressInfo;
		base = `ws://127.0.0.1:${port}`;
	});

	after(async () => {
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
		await fixture.clean();
	});

	it('accepts upgrades through the exported upgradeHandler', async () => {
		const socket = await open(`${base}/echo`, { Cookie: 'user=grace' });
		socket.send('whoami');
		assert.equal((await nextMessage(socket)).data, 'grace');
		socket.close();
	});
});
