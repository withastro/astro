import * as assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import { createConnection, createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

const READING_BODY_MARKER = 'reading-json-body';

let fixture: Fixture;
let output = '';

before(async () => {
	fixture = await loadFixture({
		root: './fixtures/aborted-request/',
		output: 'server',
		logLevel: 'info',
		adapter: nodejs({ mode: 'standalone' }),
	});
	await fixture.build();
});

after(async () => {
	await fixture.clean();
});

describe('aborted requests', () => {
	let server: ChildProcessWithoutNullStreams;
	let port: number;

	before(async () => {
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
		wireChildOutput(server);
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
	});

	it('does not report an interrupted request body as an unhandled rejection', async () => {
		const outputStart = output.length;
		// The socket is only destroyed once the server has started reading the
		// body (the fixture prints a marker), so this exercises a true mid-body
		// disconnect instead of racing server startup.
		await abortJsonRequest(port, outputStart);
		// Wait for the output to stop growing before asserting, so a slow
		// delayed log cannot slip past a single snapshot.
		await waitForStableOutput();

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

	it('logs a rejected fetch handler once with its request URL and returns a 500', async () => {
		const outputStart = output.length;
		const response = await fetch(`http://127.0.0.1:${port}/throw`, {
			signal: AbortSignal.timeout(5000),
		});
		assert.equal(response.status, 500);
		assert.equal(await response.text(), 'Internal Server Error');
		await waitFor(
			() => output.slice(outputStart).includes('intentional throw'),
			() => `Timed out waiting for server output:\n${output}`,
		);

		const lines = output
			.slice(outputStart)
			.trim()
			.split('\n')
			.filter((line) => line.includes('Could not render'));
		assert.equal(lines.length, 1);
		const log = JSON.parse(lines[0]);
		assert.equal(log.level, 'error');
		assert.equal(log.label, '@astrojs/node');
		assert.match(log.message, new RegExp(`Could not render http://127\\.0\\.0\\.1:${port}/throw`));
		assert.match(log.message, /Error: intentional throw/);
		assert.ok(
			!output.slice(outputStart).includes('Unhandled rejection'),
			'a handled fetch handler rejection should not surface as an unhandled rejection',
		);
	});

	it('still serves normal requests', async () => {
		const getRes = await fetch(`http://127.0.0.1:${port}`);
		assert.equal(getRes.status, 200);
		assert.equal(await getRes.text(), 'ok');

		const postRes = await fetch(`http://127.0.0.1:${port}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ complete: true }),
		});
		assert.equal(postRes.status, 200);
		assert.equal(await postRes.text(), 'ok');
	});
});

describe('multiple standalone entries in one process', () => {
	let server: ChildProcessWithoutNullStreams;
	let portA: number;
	let portB: number;

	before(async () => {
		portA = await getAvailablePort();
		portB = await getAvailablePort();
		server = spawn(
			process.execPath,
			[fileURLToPath(new URL('./aborted-request-two-entry-child.mjs', import.meta.url))],
			{
				env: {
					...process.env,
					ENTRY_URL: new URL('./fixtures/aborted-request/dist/server/entry.mjs', import.meta.url)
						.href,
					PORT_A: String(portA),
					PORT_B: String(portB),
					HOST: '127.0.0.1',
					ASTRO_NODE_LOGGING: 'disabled',
				},
			},
		);
		wireChildOutput(server);
		await waitFor(
			async () => {
				if (server.exitCode !== null) return false;
				try {
					const [responseA, responseB] = await Promise.all([
						fetch(`http://127.0.0.1:${portA}`),
						fetch(`http://127.0.0.1:${portB}`),
					]);
					await responseA.body?.cancel();
					await responseB.body?.cancel();
					return true;
				} catch {
					return false;
				}
			},
			() => `Timed out waiting for servers to listen:\n${output}`,
		);
	});

	after(async () => {
		server.kill();
		if (server.exitCode === null) await once(server, 'exit');
	});

	it('does not leak ECONNRESET from an aborted body handled by either entry', async () => {
		const outputStart = output.length;
		await abortJsonRequest(portA, outputStart);
		await abortJsonRequest(portB, output.length);
		await waitForStableOutput();

		assert.equal(server.exitCode, null);
		assert.doesNotMatch(output.slice(outputStart), /ECONNRESET|Unhandled rejection/);
	});

	it('logs each unhandled rejection exactly once across entries', async () => {
		const startA = output.length;
		const responseA = await fetch(`http://127.0.0.1:${portA}/rejection`);
		assert.equal(await responseA.text(), 'ok');
		await waitFor(
			() => output.slice(startA).includes('intentional rejection'),
			() => `Timed out waiting for server output:\n${output}`,
		);
		// The duplicate from a faulty multi-listener implementation could arrive
		// in a later event-loop turn, so wait for the output to stabilize before
		// asserting on the slice.
		await waitForStableOutput();
		const linesA = output.slice(startA).trim().split('\n');
		assert.equal(linesA.length, 1, `expected one log line, got:\n${output.slice(startA)}`);
		const logA = JSON.parse(linesA[0]);
		assert.equal(logA.level, 'error');
		assert.equal(logA.label, '@astrojs/node');
		assert.match(logA.message, new RegExp(`:${portA}/rejection`));

		const startB = output.length;
		const responseB = await fetch(`http://127.0.0.1:${portB}/rejection`);
		assert.equal(await responseB.text(), 'ok');
		await waitFor(
			() => output.slice(startB).includes('intentional rejection'),
			() => `Timed out waiting for server output:\n${output}`,
		);
		await waitForStableOutput();
		const linesB = output.slice(startB).trim().split('\n');
		assert.equal(linesB.length, 1, `expected one log line, got:\n${output.slice(startB)}`);
		const logB = JSON.parse(linesB[0]);
		assert.equal(logB.level, 'error');
		assert.equal(logB.label, '@astrojs/node');
		assert.match(logB.message, new RegExp(`:${portB}/rejection`));
	});
});

function wireChildOutput(child: ChildProcessWithoutNullStreams): void {
	child.stdout.setEncoding('utf8');
	child.stderr.setEncoding('utf8');
	child.stdout.on('data', (data) => (output += data));
	child.stderr.on('data', (data) => (output += data));
}

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

async function abortJsonRequest(port: number, outputStart: number): Promise<void> {
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
	// Only destroy the socket once the fixture signals that it started reading
	// the body, so the client always disconnects mid-body read.
	await waitFor(
		() => output.slice(outputStart).includes(READING_BODY_MARKER),
		() => 'Timed out waiting for the server to start reading the request body',
	);
	await new Promise((resolve) => setTimeout(resolve, 20));
	socket.destroy();
}

async function waitForStableOutput(intervalMs = 200, stableTicks = 3): Promise<void> {
	let lastLength = -1;
	let stable = 0;
	for (let attempts = 0; attempts < 40; attempts++) {
		if (output.length === lastLength) {
			stable++;
			if (stable >= stableTicks) return;
		} else {
			lastLength = output.length;
			stable = 0;
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	assert.fail(`Output never stabilized:\n${output}`);
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
