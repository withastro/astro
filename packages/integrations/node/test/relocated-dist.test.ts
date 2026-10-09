import * as assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import { createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

const fixtureDir = new URL('./fixtures/relocated-dist/', import.meta.url);
const distDir = new URL('./fixtures/relocated-dist/dist/', import.meta.url);
const relocatedDir = new URL('./fixtures/relocated-dist/relocated/', import.meta.url);

describe('relocated build output', () => {
	let fixture: Fixture;
	let server: ChildProcessWithoutNullStreams;
	let port: number;
	let output = '';

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/relocated-dist/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();

		// Move the build output to a different directory before running it.
		fs.rmSync(relocatedDir, { recursive: true, force: true });
		fs.renameSync(distDir, relocatedDir);

		port = await getAvailablePort();
		server = spawn(process.execPath, [fileURLToPath(new URL('./server/entry.mjs', relocatedDir))], {
			cwd: fileURLToPath(fixtureDir),
			env: {
				...process.env,
				ASTRO_NODE_AUTOSTART: 'enabled',
				ASTRO_NODE_LOGGING: 'disabled',
				HOST: '127.0.0.1',
				PORT: String(port),
			},
		});
		server.stdout.setEncoding('utf8');
		server.stderr.setEncoding('utf8');
		server.stdout.on('data', (data) => (output += data));
		server.stderr.on('data', (data) => (output += data));
		await waitFor(
			async () => {
				if (server.exitCode !== null) return false;
				const response = await fetch(`http://127.0.0.1:${port}/`);
				await response.body?.cancel();
				return true;
			},
			() => `Timed out waiting for server to listen:\n${output}`,
		);
	});

	after(async () => {
		server.kill();
		fs.rmSync(relocatedDir, { recursive: true, force: true });
		await fixture.clean();
	});

	it('renders on-demand pages', async () => {
		const response = await fetch(`http://127.0.0.1:${port}/`);
		assert.equal(response.status, 200);
		assert.match(await response.text(), /on-demand/);
	});

	it('serves prerendered pages', async () => {
		const response = await fetch(`http://127.0.0.1:${port}/prerendered/`);
		assert.equal(response.status, 200);
		assert.match(await response.text(), /prerendered/);
	});

	it('serves static files from the relocated client directory', async () => {
		const response = await fetch(`http://127.0.0.1:${port}/hello.txt`);
		assert.equal(response.status, 200);
		assert.equal((await response.text()).trim(), 'hello from public');
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
