import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('astro check', () => {
	it('returns true (exit code 1) when @astrojs/check and typescript cannot be loaded', async () => {
		// `ci-info` reads the environment on import. In CI mode `getPackage` returns
		// undefined for missing packages instead of prompting or installing them.
		process.env.CI = 'true';
		const { check } = await import('../../../dist/cli/check/index.js');

		// Outside the monorepo, so neither package resolves from `root`.
		const root = await mkdtemp(join(tmpdir(), 'astro-check-missing-deps-'));
		try {
			const result = await check({ _: [], root, silent: true });
			assert.equal(result, true);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
