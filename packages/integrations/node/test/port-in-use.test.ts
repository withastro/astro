import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer, type Server } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('standalone server when the port is in use', () => {
	let fixture: Fixture;
	let blocker: Server;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/url/',
			outDir: './dist/port-in-use/',
			output: 'server',
			logLevel: 'error',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		blocker = createServer();
		blocker.listen(0, '127.0.0.1');
		await once(blocker, 'listening');
	});

	after(async () => {
		blocker.close();
		await fixture.clean();
	});

	it('logs the listen error and exits with a non-zero code', async () => {
		const address = blocker.address();
		assert.ok(address && typeof address === 'object');
		const server = spawn(
			process.execPath,
			[fileURLToPath(new URL('./fixtures/url/dist/port-in-use/server/entry.mjs', import.meta.url))],
			{
				env: {
					...process.env,
					ASTRO_NODE_AUTOSTART: 'enabled',
					HOST: '127.0.0.1',
					PORT: String(address.port),
				},
			},
		);
		let output = '';
		server.stdout.setEncoding('utf8');
		server.stderr.setEncoding('utf8');
		server.stdout.on('data', (data) => (output += data));
		server.stderr.on('data', (data) => (output += data));
		const [code] = await once(server, 'exit');

		assert.equal(code, 1);
		assert.match(output, /EADDRINUSE/);
	});
});
