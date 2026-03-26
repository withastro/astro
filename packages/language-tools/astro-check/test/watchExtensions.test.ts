import assert from 'node:assert';
import { describe, it } from 'node:test';
import { resolveWatchExtensions } from '../dist/index.js';

describe('astro-check - resolveWatchExtensions', async () => {
	it('returns unique non-empty extensions from root files', async () => {
		const result = resolveWatchExtensions([
			'/project/src/index.ts',
			'/project/src/page.astro',
			'/project/src/index.ts',
			'/project/src/no-extension',
		]);

		assert.deepStrictEqual(result, ['.ts', '.astro']);
	});

	it('falls back to default watch extensions when no extension is found', async () => {
		const result = resolveWatchExtensions([
			'/project/Dockerfile',
			'/project/Makefile',
			'/project/README',
		]);

		assert.deepStrictEqual(result, [
			'.astro',
			'.ts',
			'.tsx',
			'.js',
			'.jsx',
			'.mjs',
			'.cjs',
			'.mts',
			'.cts',
			'.json',
		]);
	});
});
