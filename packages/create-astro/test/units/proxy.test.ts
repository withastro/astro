import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import path from 'node:path';

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
				output.includes('ECONNREFUSED') || output.includes('127.0.0.1:19999'),
				`Expected proxy connection error, got: ${output.substring(0, 500)}`,
			);
		}
	});

	it('works normally without proxy env vars', () => {
		// Without proxy vars, create-astro should not re-exec and should work normally
		const result = execFileSync(
			process.execPath,
			[createAstroPath, '--template', 'minimal', '--yes', '--dry-run'],
			{
				env: {
					...process.env,
					HTTP_PROXY: '',
					HTTPS_PROXY: '',
					http_proxy: '',
					https_proxy: '',
				},
				timeout: 15000,
				stdio: 'pipe',
			},
		);
		const output = result.toString();
		assert.ok(
			output.includes('Skipping template copying') || output.includes('Project initialized'),
			`Expected normal dry-run output, got: ${output.substring(0, 500)}`,
		);
	});
});
