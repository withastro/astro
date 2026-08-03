import assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import { createConnection, createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('aborted requests', () => {
	let fixture: Fixture;
	let server: ChildProcessWithoutNullStreams;
	let port: number;
	let output = '';

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/aborted-request/',
			output: 'server',
			logLevel: 'info',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		port = await getAvailablePort();
		server = spawn(
			process.execPath,
			[fileURLToPath(new URL('./fixtures/aborted-request/dist/server/entry.mjs', import.meta.url))],
			{
				env: {
					...process.env,
					ASTRO_NODE_AUTOSTART: 'enabled',
					ASTRO_NODE_LOGGING: 'disabled',
					HOST: '127.0.0.1',
					PORT: String(port),
				},
			},
		);
		server.stdout.setEncoding('utf8');
		server.stderr.setEncoding('utf8');
		server.stdout.on('data', (data) => (output += data));
		server.stderr.on('data', (data) => (output += data));
		await waitFor(
			async () => {
				if (server.exitCode !== null) return false;
				const response = await fetch(`http://127.0.0.1:${port}`);
				await response.body?.cancel();
				return true;
			},
			() => `Timed out waiting for server to listen:\n${output}`,
		);
	});

	after(async () => {
		server.kill();
		if (server.exitCode === null) await once(server, 'exit');
		await fixture.clean();
	});

	it('does not report an interrupted request body as an unhandled rejection', async () => {
		const outputStart = output.length;
		await abortJsonRequest(port);
		await new Promise((resolve) => setTimeout(resolve, 100));

		assert.equal(server.exitCode, null);
		assert.doesNotMatch(output.slice(outputStart), /ECONNRESET|Unhandled rejection/);
	});

	it('logs a real unhandled rejection once with its request URL through the JSON logger', async () => {
		const outputStart = output.length;
		const response = await fetch(`http://127.0.0.1:${port}/rejection`);
		assert.equal(await response.text(), 'ok');
		await waitFor(
			() => output.slice(outputStart).includes('intentional rejection'),
			() => `Timed out waiting for server output:\n${output}`,
		);

		const lines = output.slice(outputStart).trim().split('\n');
		assert.equal(lines.length, 1);
		const log = JSON.parse(lines[0]);
		assert.equal(log.level, 'error');
		assert.equal(log.label, '@astrojs/node');
		assert.match(
			log.message,
			new RegExp(`Unhandled rejection while rendering http://127\\.0\\.0\\.1:${port}/rejection`),
		);
		assert.match(log.message, /Error: intentional rejection/);
	});
});

async function getAvailablePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	assert(address && typeof address === 'object');
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	return address.port;
}

async function abortJsonRequest(port: number): Promise<void> {
	const socket = await new Promise<import('node:net').Socket>((resolve, reject) => {
		const connection = createConnection(port, '127.0.0.1', () => resolve(connection));
		connection.once('error', reject);
	});
	await new Promise<void>((resolve, reject) =>
		socket.write(
			`POST / HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nContent-Type: application/json\r\nContent-Length: 1000000\r\nConnection: close\r\n\r\n{"partial":`,
			(error) => (error ? reject(error) : resolve()),
		),
	);
	await new Promise((resolve) => setTimeout(resolve, 20));
	socket.destroy();
}

async function waitFor(
	check: () => boolean | Promise<boolean>,
	getError: () => string,
): Promise<void> {
	for (let attempts = 0; attempts < 100; attempts++) {
		try {
			if (await check()) return;
		} catch {
			// Keep polling.
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	assert.fail(getError());
}
