import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

describe('astro-check - binary', async () => {
	it('Can run the binary', async () => {
		const childProcess = spawnSync('node', ['../bin/astro-check.js', '--root', './fixture'], {
			cwd: fileURLToPath(new URL('./', import.meta.url)),
		});

		assert.strictEqual(childProcess.status, 1);
		assert.ok(childProcess.stdout.toString().includes('Getting diagnostics for Astro files in'));
		assert.ok(childProcess.stdout.toString().includes('1 error'));
		assert.ok(childProcess.stdout.toString().includes('1 warning'));
		assert.ok(childProcess.stdout.toString().includes('1 hint'));
	});
});
