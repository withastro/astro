import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { loadFixture } from './test-utils.js';
import { createRequestAndResponse } from './units/test-utils.js';

const createMockSocket = () => {
	const socket = new EventEmitter();
	// @ts-expect-error - emulate shape of a Node socket for the adapter
	socket.encrypted = false;
	// @ts-expect-error - emulate shape of a Node socket for the adapter
	socket.remoteAddress = '127.0.0.1';
	// @ts-expect-error - emulate shape of a Node socket for the adapter
	socket.destroyed = false;
	// @ts-expect-error - emulate shape of a Node socket for the adapter
	socket.writable = true;
	// @ts-expect-error - emulate shape of a Node socket for the adapter
	socket.destroy = () => {
		socket.destroyed = true;
		socket.emit('close');
	};
	return socket;
};

const attachSocket = (socket, req, res) => {
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
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => Promise<void>} */
	let handle;

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
