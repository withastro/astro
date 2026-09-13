import * as assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import type { UserOptions } from '../src/types.js';
import { type AdapterServer, type Fixture, loadFixture, waitServerListen } from './test-utils.ts';

describe('Graceful Shutdown', () => {
	let fixture: Fixture;
	let server: AdapterServer;

	async function buildFixture(shutdown: UserOptions['shutdown']) {
		fixture = await loadFixture({
			root: './fixtures/graceful-shutdown/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone', shutdown }),
		});
		await fixture.build();
	}

	beforeEach(async () => {
		const { startServer } = await fixture.loadAdapterEntryModule();
		({ server } = startServer());
		await waitServerListen(server.server);
	});

	afterEach(async () => {
		process.removeAllListeners('SIGTERM');
		process.removeAllListeners('SIGINT');
		await server.stop().catch(() => {});
	});

	describe('default timeout', () => {
		before(() => buildFixture(undefined));
		after(() => fixture.clean());

		it('serves requests normally before shutdown', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);
		});

		it('rejects connections once server.close() is called', async () => {
			server.server.close();
			await assertConnectionRefused(fixture.fetch('/'));
		});

		it('rejects connections once SIGTERM emitted', async () => {
			assert.ok(process.listenerCount('SIGTERM') > 0, 'SIGTERM listener registered');
			process.emit('SIGTERM');
			await assertConnectionRefused(fixture.fetch('/'));
		});

		it('rejects connections once SIGINT emitted', async () => {
			assert.ok(process.listenerCount('SIGINT') > 0, 'SIGINT listener registered');
			process.emit('SIGINT');
			await assertConnectionRefused(fixture.fetch('/'));
		});

		it('handles SIGINT and SIGTERM being emitted', async () => {
			process.emit('SIGINT');
			process.emit('SIGTERM');
			await server.closed();
		});

		it('handles server already closed', async () => {
			server.server.close();
			process.emit('SIGTERM');
			await server.closed();
		});

		it('closed() waits for every concurrent response before resolving', async () => {
			const order: string[] = [];
			let completedCount = 0;

			const makeSlowRequest = (delay: number) =>
				fixture.fetch(`/api/slow?delay=${delay}`).then(async (res) => {
					const body = await res.text();
					completedCount++;
					if (completedCount === 2) {
						order.push('responses');
						server.server.closeIdleConnections();
					}
					return { status: res.status, body };
				});

			// Start two concurrent slow requests with different delays.
			const req1 = makeSlowRequest(100);
			const req2 = makeSlowRequest(200);

			// Give both requests time to reach the server before initiating shutdown.
			await new Promise<void>((resolve) => setTimeout(resolve, 50));

			process.emit('SIGTERM');

			const closedPromise = server.closed().then(() => order.push('closed'));

			const [res1, res2] = await Promise.all([req1, req2, closedPromise]);

			assert.equal(res1.status, 200);
			assert.equal(res1.body, 'slow response');
			assert.equal(res2.status, 200);
			assert.equal(res2.body, 'slow response');
			assert.deepEqual(
				order,
				['responses', 'closed'],
				'closed() must not resolve before all concurrent in-flight requests complete',
			);
		});
	});

	describe('instant timeout', () => {
		before(() => buildFixture({ timeout: 0 }));
		after(() => fixture.clean());

		it('server closes immediately even when a connection is stalled', async () => {
			// Open a connection that never finishes to keep the server waiting after close().
			const request = fixture.fetch('/api/hang');

			// Give the hanging request time to connect.
			await new Promise<void>((resolve) => setTimeout(resolve, 50));

			process.emit('SIGTERM');
			const timeout = setTimeout(
				() =>
					assert.fail(
						'The handing request should have aborted immediately since timeout is set to 0',
					),
				500,
			);

			await server.closed();
			clearTimeout(timeout);

			await assertConnectionAborted(request);
		});
	});

	describe('1ms timeout', () => {
		before(() => buildFixture({ timeout: 1 }));
		after(() => fixture.clean());

		it("don't timeout if the request finishes before the timeout", async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);

			process.emit('SIGTERM');
			await server.closed();

			// Make sure the timeout doesn't fire and trigger any unhandled rejections after the server is closed.
			await new Promise((resolve) => setTimeout(resolve, 50));
		});
	});

	describe('exit enabled', () => {
		let processExitCalled = false;
		before(async () => {
			await buildFixture({ timeout: 1, exit: true });
			process.exit = () => {
				processExitCalled = true;
				return null as never;
			};
		});

		after(() => fixture.clean());

		it('calls process.exit() after shutdown completes normally', async () => {
			process.emit('SIGTERM');
			await server.closed();

			assert.ok(processExitCalled, 'process.exit() should have been called');
		});

		it('calls process.exit() after shutdown times out', async () => {
			const request = fixture.fetch('/api/slow?delay=100');

			// Give the request time to reach the server before initiating shutdown.
			await new Promise<void>((resolve) => setTimeout(resolve, 50));

			process.emit('SIGTERM');
			await server.closed();

			await assertConnectionAborted(request);
			assert.ok(processExitCalled, 'process.exit() should have been called');
		});

		it('calls process.exit() even if server already closed', async () => {
			server.server.close();

			process.emit('SIGTERM');
			await server.closed();

			assert.ok(processExitCalled, 'process.exit() should have been called');
		});
	});

	describe('infinite timeout', () => {
		before(() => buildFixture({ timeout: Number.POSITIVE_INFINITY }));
		after(() => fixture.clean());

		it('waits indefinitely for an in-flight request instead of force-closing', async () => {
			const request = fixture.fetch('/api/slow?delay=100');

			// Give the request time to reach the server before initiating shutdown.
			await new Promise<void>((resolve) => setTimeout(resolve, 50));

			process.emit('SIGTERM');

			const res = await request;
			assert.equal(res.status, 200);
			assert.equal(await res.text(), 'slow response');
		});
	});
});

async function assertConnectionRefused(fetchPromise: Promise<Response>) {
	await assert.rejects(
		() => fetchPromise,
		(err: any) => ['ECONNREFUSED', 'ECONNRESET'].includes(err.cause?.code),
		'The request should be refused.',
	);
}

async function assertConnectionAborted(fetchPromise: Promise<Response>) {
	await assert.rejects(
		fetchPromise,
		(err: any) => ['ECONNREFUSED', 'ECONNRESET', 'UND_ERR_SOCKET'].includes(err.cause?.code),
		'The request should be aborted.',
	);
}
