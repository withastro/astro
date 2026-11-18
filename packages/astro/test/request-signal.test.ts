import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequestAndResponse } from './integration-test-helpers.ts';
import { type DevServer, type Fixture, loadFixture, type RequestHandler } from './test-utils.ts';

type MockSocket = EventEmitter & {
	encrypted: boolean;
	remoteAddress: string;
	destroyed: boolean;
	writable: boolean;
	destroy: () => void;
};

const createMockSocket = (): MockSocket => {
	const socket = new EventEmitter() as MockSocket;
	socket.encrypted = false;
	socket.remoteAddress = '127.0.0.1';
	socket.destroyed = false;
	socket.writable = true;
	socket.destroy = () => {
		socket.destroyed = true;
		socket.emit('close');
	};
	return socket;
};

const attachSocket = (socket: MockSocket, req: IncomingMessage, res: ServerResponse) => {
	Object.defineProperty(req, 'socket', {
		configurable: true,
		value: socket,
		writable: true,
	});
	Object.defineProperty(res, 'socket', {
		configurable: true,
		value: socket,
		writable: true,
	});
};

describe('Node request abort integration', () => {
	let fixture: Fixture;
	let handle: RequestHandler;

	const resetAbortState = async () => {
		const resetRequest = createRequestAndResponse({
			method: 'GET',
			url: '/status.json?reset=1',
		});
		handle(resetRequest.req, resetRequest.res);
		await resetRequest.done;
	};

	const readAbortState = async () => {
		const statusRequest = createRequestAndResponse({
			method: 'GET',
			url: '/status.json',
		});
		handle(statusRequest.req, statusRequest.res);
		return await statusRequest.json();
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/request-signal/',
			outDir: './dist/request-signal/',
		});
		await fixture.build();
		handle = await fixture.loadNodeAdapterHandler();
	});

	after(async () => {
		await fixture.clean();
	});

	it('aborts request.signal when the underlying socket closes', async () => {
		await resetAbortState();

		const streamRequest = createRequestAndResponse({
			method: 'GET',
			url: '/stream',
		});

		const socket = createMockSocket();
		attachSocket(socket, streamRequest.req, streamRequest.res);

		const streamPromise = handle(streamRequest.req, streamRequest.res);

		await delay(10);
		socket.destroyed = true;
		socket.emit('close');

		await streamRequest.done;
		await streamPromise;

		const payload = await readAbortState();

		assert.equal(payload.aborted, true);
		assert.deepEqual(payload.events, ['started', 'aborted']);
	});

	it('aborts request.signal for SSE responses when the underlying socket closes', async () => {
		await resetAbortState();

		const sseRequest = createRequestAndResponse({
			method: 'GET',
			url: '/sse',
		});

		const socket = createMockSocket();
		attachSocket(socket, sseRequest.req, sseRequest.res);

		const ssePromise = handle(sseRequest.req, sseRequest.res);

		await delay(10);
		socket.destroyed = true;
		socket.emit('close');

		await sseRequest.done;
		await ssePromise;

		const payload = await readAbortState();

		assert.equal(payload.aborted, true);
		assert.deepEqual(payload.events, ['started', 'aborted']);
	});
});

describe('Dev server request abort signal', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/request-signal/',
			outDir: './dist/request-signal-dev/',
			cacheDir: './node_modules/.astro-test/request-signal-dev/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('aborts request.signal when the client disconnects', async () => {
		const controller = new AbortController();
		const fetchPromise = fixture
			.fetch('/dev-signal-test', { signal: controller.signal })
			.then((r) => r.json())
			.catch(() => null);

		// Give the server a moment to start processing, then abort
		await delay(200);
		controller.abort();

		// The fetch will throw on the client side; the server should still
		// resolve its response internally. Wait for the server to finish.
		await fetchPromise;
		await delay(500);

		// Send a second request *without* aborting to confirm the endpoint
		// reports aborted=false when the signal is not aborted.
		const normalRes = await fixture.fetch('/dev-signal-test');
		const normalPayload = await normalRes.json();
		assert.equal(normalPayload.aborted, false, 'non-aborted request should report aborted=false');
	});
});
