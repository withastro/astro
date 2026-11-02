import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { describe, it } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('astro check', () => {
	it('returns true (exit code 1) when @astrojs/check and typescript cannot be loaded', async () => {
		// Outside the monorepo, so neither package resolves from `root`.
		const root = await mkdtemp(join(tmpdir(), 'astro-check-missing-deps-'));
		const checkModule = new URL('../../../dist/cli/check/index.js', import.meta.url).href;
		// `ci-info` reads the environment once on import, so CI mode is set in a child
		// process. In CI mode `getPackage` returns undefined for missing packages
		// instead of prompting or installing them.
		const script = `
			const { check } = await import(${JSON.stringify(checkModule)});
			const result = await check({ _: [], root: ${JSON.stringify(root)}, silent: true });
			console.log(JSON.stringify(result));
		`;
		try {
			const { stdout } = await execFileAsync(
				process.execPath,
				['--input-type=module', '-e', script],
				{ env: { ...process.env, CI: 'true' } },
			);
			assert.equal(stdout.trim().split('\n').at(-1), 'true');
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
