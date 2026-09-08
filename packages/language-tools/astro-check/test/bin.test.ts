import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('astro-check - binary', async () => {
	it('Can run the binary', async () => {
		const pkgPath = fileURLToPath(new URL('..', import.meta.url));
		const binPath = path.join(pkgPath, 'bin', 'astro-check.js');
		const fixturePath = path.join(pkgPath, 'test', 'fixture');
		const childProcess = spawnSync('node', [binPath], {
			// Set the working directory to the fixture directory so that `astro check` can use the tsconfig in the fixture directory.
			cwd: fixturePath,
		});

		assert.strictEqual(childProcess.status, 1);
		assert.ok(childProcess.stdout.toString().includes('Getting diagnostics for Astro files in'));
		assert.ok(childProcess.stdout.toString().includes('1 error'));
		assert.ok(childProcess.stdout.toString().includes('1 warning'));
		assert.ok(childProcess.stdout.toString().includes('1 hint'));
	});
});
