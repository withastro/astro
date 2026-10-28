import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const createAstroPath = path.resolve(fileURLToPath(import.meta.url), '../../../create-astro.mjs');

describe('proxy support', () => {
	it('respects HTTPS_PROXY when --use-env-proxy is available', () => {
		// Set a non-existent proxy so fetch will fail with ECONNREFUSED if proxy is used.
		// With the fix, create-astro re-execs with --use-env-proxy, so native fetch()
		// routes through the proxy, causing a connection error to our fake proxy.
		try {
			execFileSync(
				process.execPath,
				[createAstroPath, '--template', 'minimal', '--yes', '--dry-run'],
				{
					env: {
						...process.env,
						HTTPS_PROXY: 'http://127.0.0.1:19999',
						HTTP_PROXY: 'http://127.0.0.1:19999',
					},
					timeout: 15000,
					stdio: 'pipe',
				},
			);
			// If it succeeds, the proxy was ignored (bug not fixed)
			assert.fail('Expected create-astro to fail when proxy is unreachable');
		} catch (e: any) {
			// The process should fail because the proxy is unreachable.
			// This proves the proxy env var was respected.
			const output = (e.stderr?.toString() || '') + (e.stdout?.toString() || '');
			assert.ok(
				output.includes('ECONNREFUSED') ||
					output.includes('127.0.0.1:19999') ||
					output.includes('Unable to connect to the internet'),
				`Expected proxy connection error, got: ${output.substring(0, 500)}`,
			);
		}
	});

	it('works normally without proxy env vars', async () => {
		// Without proxy vars, create-astro should not re-exec and should work normally.
		// Point --template at a local server (via create-astro's third-party template
		// support) instead of a real GitHub template, so this test doesn't depend on
		// GitHub being reachable. `execFile` (not `execFileSync`) is required here since
		// a synchronous child process would block this process's event loop and prevent
		// the local server below from accepting the connection.
		const server = http.createServer((_req, res) => {
			res.writeHead(200);
			res.end();
		});
		await new Promise<void>((resolve) => server.listen(0, resolve));
		const { port } = server.address() as AddressInfo;

		try {
			const { stdout } = await execFileAsync(
				process.execPath,
				[createAstroPath, '--template', `http://127.0.0.1:${port}/template`, '--yes', '--dry-run'],
				{
					env: {
						...process.env,
						HTTP_PROXY: '',
						HTTPS_PROXY: '',
						http_proxy: '',
						https_proxy: '',
					},
					timeout: 15000,
				},
			);
			assert.ok(
				stdout.includes('Skipping template copying') || stdout.includes('Project initialized'),
				`Expected normal dry-run output, got: ${stdout.substring(0, 500)}`,
			);
		} finally {
			server.close();
		}
	});
});
