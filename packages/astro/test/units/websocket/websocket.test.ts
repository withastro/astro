import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEndpoint, createTestApp } from '../mocks.ts';
import { isWebSocketUpgradeRequest } from '../../../dist/core/websocket/handler.js';
import type { APIContext } from '../../../dist/types/public/context.js';
import type { UpgradeWebSocketHook } from '../../../dist/core/websocket/types.js';

function upgradeRequest(
	headers: Record<string, string> = { upgrade: 'websocket' },
	method = 'GET',
) {
	return new Request('http://example.com/socket', { method, headers });
}

/** An app with one endpoint that reports what it saw on `context.websocket`. */
function createSocketApp(handler: (ctx: APIContext) => Response | Promise<Response>) {
	return createTestApp([createEndpoint({ GET: handler, ALL: handler }, { route: '/socket' })]);
}

/** A stand-in adapter hook that records its calls. */
function createHook() {
	const calls: Request[] = [];
	const response = new Response(null, { status: 200 });
	const hook: UpgradeWebSocketHook = (request) => {
		calls.push(request);
		return { socket: {} as WebSocket, response };
	};
	return { hook, calls, response };
}

describe('isWebSocketUpgradeRequest', () => {
	it('accepts a GET request with `Upgrade: websocket`', () => {
		assert.equal(isWebSocketUpgradeRequest(upgradeRequest()), true);
	});

	it('matches the protocol case-insensitively', () => {
		assert.equal(isWebSocketUpgradeRequest(upgradeRequest({ upgrade: 'WebSocket' })), true);
	});

	it('finds websocket in a comma-separated list', () => {
		assert.equal(isWebSocketUpgradeRequest(upgradeRequest({ upgrade: 'h2c, websocket' })), true);
	});

	it('rejects other protocols', () => {
		assert.equal(isWebSocketUpgradeRequest(upgradeRequest({ upgrade: 'h2c' })), false);
	});

	it('rejects requests without an Upgrade header', () => {
		assert.equal(isWebSocketUpgradeRequest(upgradeRequest({})), false);
	});

	it('rejects non-GET methods', () => {
		assert.equal(
			isWebSocketUpgradeRequest(upgradeRequest({ upgrade: 'websocket' }, 'POST')),
			false,
		);
	});
});

describe('context.websocket', () => {
	it('is undefined when the adapter passes no upgrade hook', async () => {
		let seen: unknown = 'unset';
		const app = createSocketApp((ctx) => {
			seen = ctx.websocket;
			return new Response('ok');
		});
		await app.render(upgradeRequest());
		assert.equal(seen, undefined);
	});

	it('returns the adapter response from upgrade()', async () => {
		const { hook, calls, response } = createHook();
		const app = createSocketApp((ctx) => ctx.websocket!.upgrade().response);
		const result = await app.render(upgradeRequest(), { upgradeWebSocket: hook });
		assert.equal(calls.length, 1);
		assert.equal(result, response);
	});

	it('reports whether the request is an upgrade request', async () => {
		const { hook } = createHook();
		const results: boolean[] = [];
		const app = createSocketApp((ctx) => {
			results.push(ctx.websocket!.isUpgradeRequest());
			return new Response('ok');
		});
		await app.render(upgradeRequest(), { upgradeWebSocket: hook });
		await app.render(upgradeRequest({}), { upgradeWebSocket: hook });
		assert.deepEqual(results, [true, false]);
	});

	it('throws WebSocketNotUpgradeRequest without calling the hook for a normal request', async () => {
		const { hook, calls } = createHook();
		let error: any;
		const app = createSocketApp((ctx) => {
			try {
				ctx.websocket!.upgrade();
			} catch (err) {
				error = err;
			}
			return new Response('ok');
		});
		await app.render(upgradeRequest({}), { upgradeWebSocket: hook });
		assert.equal(error?.name, 'WebSocketNotUpgradeRequest');
		assert.equal(calls.length, 0);
	});

	it('throws WebSocketAlreadyUpgraded when upgrade() is called twice', async () => {
		const { hook, calls } = createHook();
		let error: any;
		const app = createSocketApp((ctx) => {
			const { response } = ctx.websocket!.upgrade();
			try {
				ctx.websocket!.upgrade();
			} catch (err) {
				error = err;
			}
			return response;
		});
		await app.render(upgradeRequest(), { upgradeWebSocket: hook });
		assert.equal(error?.name, 'WebSocketAlreadyUpgraded');
		assert.equal(calls.length, 1);
	});
});
