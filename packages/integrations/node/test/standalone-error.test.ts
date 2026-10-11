import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Standalone EADDRINUSE error handling', () => {
	let fixture: Fixture;
	let entryPath: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/bad-urls/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		entryPath = fileURLToPath(new URL('./dist/server/entry.mjs', fixture.config.root));
	});

	it('exits non-zero with an error message when the port is already taken', async () => {
		// Occupy a port
		const blocker = net.createServer();
		await new Promise<void>((resolve) => blocker.listen(0, '127.0.0.1', () => resolve()));
		const address = blocker.address() as net.AddressInfo;
		const port = address.port;

		try {
			const env = {
				...process.env,
				HOST: '127.0.0.1',
				PORT: String(port),
			};
			delete env.ASTRO_NODE_AUTOSTART;

			const child = spawn(process.execPath, [entryPath], {
				env,
				stdio: ['ignore', 'pipe', 'pipe'],
			});

			let stderr = '';
			let stdout = '';
			child.stderr.on('data', (d) => {
				stderr += d.toString();
			});
			child.stdout.on('data', (d) => {
				stdout += d.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				child.on('exit', (code) => resolve(code));
			});

			// In unpatched Astro, the process silently exits with code 0.
			// The expected behavior is that it exits with code 1 and outputs an error.
			assert.notEqual(exitCode, 0, `Expected non-zero exit code, but got ${exitCode}. Output: ${stdout}\nStderr: ${stderr}`);
			assert.equal(exitCode, 1);
			assert.match(stderr + stdout, /EADDRINUSE/);
		} finally {
			await new Promise<void>((resolve) => blocker.close(() => resolve()));
		}
	});
});
