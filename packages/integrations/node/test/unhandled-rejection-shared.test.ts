import * as assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('shared unhandledRejection listener', () => {
	let fixture: Fixture;
	let server: ChildProcessWithoutNullStreams;
	let port: number;
	let output = '';

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/unhandled-rejection-shared/',
			output: 'server',
			logLevel: 'info',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		port = await getAvailablePort();
		// AUTOSTART evaluates `handler` (createAppHandler #1) then startServer
		// (createAppHandler #2). The fix must keep a single shared listener/ALS.
		server = spawn(
			process.execPath,
			[
				fileURLToPath(
					new URL('./fixtures/unhandled-rejection-shared/dist/server/entry.mjs', import.meta.url),
				),
			],
			{
				env: {
					...process.env,
					ASTRO_NODE_AUTOSTART: 'enabled',
					ASTRO_NODE_LOGGING: 'enabled',
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
				const response = await fetch(`http://127.0.0.1:${port}/`);
				await response.body?.cancel();
				return response.ok;
			},
			() => `Timed out waiting for server to listen:\n${output}`,
		);
	});

	after(async () => {
		server.kill();
		if (server.exitCode === null) await once(server, 'exit');
		await fixture.clean();
	});

	it('attributes in-request rejections to the URL when multiple handlers are installed', async () => {
		const outputStart = output.length;

		const response = await fetch(`http://127.0.0.1:${port}/boom`);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'ok');

		await waitFor(
			() => output.slice(outputStart).includes('shared-listener-boom'),
			() => `Timed out waiting for rejection log:\n${output.slice(outputStart)}`,
		);

		const slice = output.slice(outputStart);
		assert.match(slice, /Unhandled rejection while rendering/);
		assert.match(slice, /\/boom/);
		assert.doesNotMatch(slice, /outside request context/);

		// Stale duplicate listeners used to set process.exitCode = 1 for in-request
		// rejections. Confirm the shared listener left it untouched.
		const exitCodeRes = await fetch(`http://127.0.0.1:${port}/exit-code`);
		assert.equal(await exitCodeRes.text(), 'undefined');
		assert.equal(server.exitCode, null);
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
