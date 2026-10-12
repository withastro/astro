import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('optimizeDeps include globs', () => {
	it('astro/runtime glob restricts to .js files', async () => {
		const source = await readFile(new URL('../../src/index.ts', import.meta.url), 'utf-8');
		const runtimeGlobs = [...source.matchAll(/['"]astro\/runtime\/\*\*[^'"]*['"]/g)].map((m) =>
			m[0].slice(1, -1),
		);
		assert.ok(runtimeGlobs.length > 0, 'expected at least one astro/runtime glob in the source');
		for (const glob of runtimeGlobs) {
			assert.ok(
				glob.endsWith('.js'),
				`glob "${glob}" should end with .js to avoid matching .d.ts files`,
			);
		}
	});
});
