import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import type { UpgradeHandler } from '../dist/websocket.js';
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
	// The server runs in this process, so a crash in the adapter surfaces here
	// instead of stopping a real server.
	const uncaught: unknown[] = [];
	const recordUncaught = (error: unknown) => uncaught.push(error);

	before(async () => {
		process.on('uncaughtException', recordUncaught);
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
		process.off('uncaughtException', recordUncaught);
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

	it('rejects upgrades sent by a page on another site', async () => {
		const res = await rawUpgrade(server, '/echo', {
			Origin: 'https://evil.example',
			Cookie: 'user=ada',
		});
		assert.equal(res.status, 403);
		assert.equal(res.headers['set-cookie'], undefined, 'middleware must not run');
	});

	it('rejects upgrades marked cross-site by Sec-Fetch-Site', async () => {
		const res = await rawUpgrade(server, '/echo', { 'Sec-Fetch-Site': 'cross-site' });
		assert.equal(res.status, 403);
	});

	it('accepts upgrades sent by a page on the same site', async () => {
		const res = await rawUpgrade(server, '/echo', {
			Origin: `http://${server.host}:${server.port}`,
			'Sec-Fetch-Site': 'same-origin',
		});
		assert.equal(res.status, 101);
	});

	it('closes the connection with 1009 when a message is over the size limit', {
		timeout: 5000,
	}, async () => {
		const socket = await open(`${base}/echo`);
		const closed = new Promise<CloseEvent>((resolve) =>
			socket.addEventListener('close', (event) => resolve(event), { once: true }),
		);
		socket.send('x'.repeat(2 * 1024 * 1024));
		assert.equal((await closed).code, 1009);
	});

	it('closes only the affected connection when a listener throws', { timeout: 5000 }, async () => {
		const bystander = await open(`${base}/echo`);
		const socket = await open(`${base}/json`);
		const closed = new Promise<CloseEvent>((resolve) =>
			socket.addEventListener('close', (event) => resolve(event), { once: true }),
		);
		socket.send('this is not json');
		assert.equal((await closed).code, 1011);

		bystander.send('still here');
		assert.equal((await nextMessage(bystander)).data, 'still here');
		const fresh = await open(`${base}/echo`);
		fresh.close();
		bystander.close();
	});

	it('raises no uncaught exceptions while handling hostile clients', async () => {
		// Errors are reported on a later tick, so let them surface first.
		await new Promise((resolve) => setTimeout(resolve, 50));
		assert.deepEqual(uncaught, []);
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
		const { handler, upgradeHandler } = (await fixture.loadAdapterEntryModule()) as unknown as {
			handler: http.RequestListener;
			upgradeHandler: UpgradeHandler;
		};
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
