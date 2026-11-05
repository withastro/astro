import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { AstroIntegrationLogger } from 'astro';
import { logListeningOn } from '../../dist/log-listening-on.js';

describe('logListeningOn', () => {
	let server: http.Server;

	before(async () => {
		server = http.createServer();
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	});

	after(async () => {
		await new Promise((resolve) => server.close(resolve));
	});

	it('logs when the server is already listening', async () => {
		const messages: string[] = [];
		const logger = {
			info: (message: string) => messages.push(message),
		} as unknown as AstroIntegrationLogger;

		const logged = logListeningOn(logger, server, '127.0.0.1').then(() => 'logged');
		const timeout = new Promise((resolve) => setTimeout(() => resolve('timed out'), 1000));

		assert.equal(await Promise.race([logged, timeout]), 'logged');
		const { port } = server.address() as { port: number };
		assert.deepEqual(messages, [`Server listening on http://127.0.0.1:${port}`]);
	});
});
