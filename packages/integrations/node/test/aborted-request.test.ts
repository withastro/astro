import * as assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import { createConnection, createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

const READING_BODY_MARKER = 'reading-json-body';

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
		const socket = await connect(port);
		await writePartialRequest(socket, port);
		await waitFor(
			() => output.slice(outputStart).includes(READING_BODY_MARKER),
			() => 'Timed out waiting for the server to start reading the request body',
		);
		socket.destroy();
		await waitForStableOutput(() => output.length);

		assert.doesNotMatch(output.slice(outputStart), /ECONNRESET|Unhandled rejection/);
		const response = await fetch(`http://127.0.0.1:${port}`);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'ok');
	});
});

async function getAvailablePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	assert.ok(address && typeof address === 'object');
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	return address.port;
}

function connect(port: number): Promise<import('node:net').Socket> {
	return new Promise((resolve, reject) => {
		const socket = createConnection(port, '127.0.0.1', () => resolve(socket));
		socket.once('error', reject);
	});
}

function writePartialRequest(socket: import('node:net').Socket, port: number): Promise<void> {
	return new Promise((resolve, reject) =>
		socket.write(
			`POST / HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nContent-Type: application/json\r\nContent-Length: 1000000\r\nConnection: close\r\n\r\n{"partial":`,
			(error) => (error ? reject(error) : resolve()),
		),
	);
}

async function waitForStableOutput(getLength: () => number): Promise<void> {
	let lastLength = -1;
	let stable = 0;
	for (let attempts = 0; attempts < 40; attempts++) {
		const length = getLength();
		if (length === lastLength) {
			stable++;
			if (stable >= 3) return;
		} else {
			lastLength = length;
			stable = 0;
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	assert.fail('Output never stabilized');
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
