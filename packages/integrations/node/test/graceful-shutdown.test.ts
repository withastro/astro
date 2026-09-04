import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { type AdapterServer, type Fixture, loadFixture, waitServerListen } from './test-utils.ts';

describe('Graceful Shutdown', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/graceful-shutdown/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			outDir: './dist/graceful-shutdown',
		});
		await fixture.build();
	});

	after(() => fixture.clean());

	async function startFreshServer(): Promise<AdapterServer> {
		const { startServer } = await fixture.loadAdapterEntryModule();
		const { server } = startServer();
		await waitServerListen(server.server);
		return server;
	}

	describe('no new connections accepted after server.close()', () => {
		let server: AdapterServer;

		before(async () => {
			server = await startFreshServer();
		});

		after(async () => {
			await server.stop().catch(() => {});
		});

		it('serves requests normally before shutdown', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);
		});

		it('rejects connections once server.close() is called', async () => {
			server.server.close();

			await assert.rejects(
				() => fixture.fetch('/'),
				(err: any) => {
					const code = err.code ?? err.cause?.code;
					return code === 'ECONNREFUSED' || code === 'ECONNRESET';
				},
			);
		});
	});

	describe('SIGTERM / SIGINT trigger graceful close', () => {
		let server: AdapterServer;

		before(async () => {
			server = await startFreshServer();
		});

		after(async () => {
			process.removeAllListeners('SIGTERM');
			process.removeAllListeners('SIGINT');
			await server.stop().catch(() => {});
		});

		it('SIGTERM stops accepting new connections', async () => {
			assert.ok(process.listenerCount('SIGTERM') > 0, 'SIGTERM listener registered');
			process.emit('SIGTERM');

			await assert.rejects(
				() => fixture.fetch('/'),
				(err: any) => {
					const code = err.code ?? err.cause?.code;
					return code === 'ECONNREFUSED' || code === 'ECONNRESET';
				},
			);
		});

		it('SIGINT stops accepting new connections', async () => {
			server = await startFreshServer();

			assert.ok(process.listenerCount('SIGINT') > 0, 'SIGINT listener registered');
			process.emit('SIGINT');

			await assert.rejects(
				() => fixture.fetch('/'),
				(err: any) => {
					const code = err.code ?? err.cause?.code;
					return code === 'ECONNREFUSED' || code === 'ECONNRESET';
				},
			);
		});
	});

	describe('all concurrent in-flight requests complete after server.close()', () => {
		let server: AdapterServer;

		before(async () => {
			server = await startFreshServer();
		});

		after(async () => {
			await server.stop().catch(() => {});
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

						// Normally the server would wait for the idle timeout before closing the connections and shutting down.
						// So we manually close idle connections to speed up the test.
						server.server.closeIdleConnections();
					}
					return { status: res.status, body };
				});

			// Start two concurrent slow requests with different delays.
			const req1 = makeSlowRequest(300);
			const req2 = makeSlowRequest(400);

			// Give both requests time to reach the server before initiating shutdown.
			await new Promise<void>((resolve) => setTimeout(resolve, 50));

			server.server.close();

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

	describe('force-destroy fires after timeout and event loop drains', () => {
		let server: AdapterServer;

		before(async () => {
			process.env.ASTRO_NODE_GRACEFUL_SHUTDOWN_TIMEOUT = '100';
			server = await startFreshServer();
		});

		after(async () => {
			delete process.env.ASTRO_NODE_GRACEFUL_SHUTDOWN_TIMEOUT;
			process.removeAllListeners('SIGTERM');
			process.removeAllListeners('SIGINT');
			await server.stop().catch(() => {});
		});

		it('server closes after timeout when a connection is stalled', { timeout: 1000 }, async () => {
			// Open a connection that never finishes to keep the server waiting after close().
			const request = fixture.fetch('/api/hang');

			// Give the hanging request time to connect.
			await new Promise<void>((resolve) => setTimeout(resolve, 50));

			// Trigger the real shutdown path — the 100 ms timeout will force-destroy.
			process.emit('SIGTERM');

			await server.closed();
			await assert.rejects(
				request,
				'The hanging request should be aborted after the server is force-destroyed',
			);
		});
	});
});
