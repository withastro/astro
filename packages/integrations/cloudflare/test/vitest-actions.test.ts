import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const vitestCli = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('./fixtures/vitest-actions/', import.meta.url));

describe('astro:actions in the Cloudflare vitest pool', () => {
	it('imports without unhandled WebAssembly errors in workerd', () => {
		// Reproduces https://github.com/withastro/astro/issues/17906: importing
		// `astro:actions` under `@cloudflare/vitest-pool-workers` used to load
		// `es-module-lexer`, whose WebAssembly init is disallowed by workerd,
		// surfacing as an unhandled rejection that failed the test run.
		try {
			const output = execFileSync(process.execPath, [vitestCli, 'run'], {
				cwd: fixtureRoot,
				encoding: 'utf8',
			});
			assert.ok(
				!output.includes('Unhandled Errors'),
				'vitest reported unhandled errors:\n' + output,
			);
		} catch (error: any) {
			assert.fail(`vitest run failed:\n${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`);
		}
	});
});
