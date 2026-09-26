import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const pkgPath = fileURLToPath(new URL('..', import.meta.url));
const binPath = path.join(pkgPath, 'bin', 'astro-check.js');
const testPath = path.join(pkgPath, 'test');
const fixturePath = path.join(testPath, 'fixture');

function runBinary(args: string[], cwd: string) {
	const childProcess = spawnSync('node', [binPath, ...args], { cwd });
	return { status: childProcess.status, stdout: childProcess.stdout.toString() };
}

describe('astro-check - binary', async () => {
	it('Can run the binary', async () => {
		// Set the working directory to the fixture directory so that `astro check` can use the tsconfig in the fixture directory.
		const { status, stdout } = runBinary([], fixturePath);

		assert.strictEqual(status, 1);
		assert.ok(stdout.includes('Getting diagnostics for Astro files in'));
		assert.ok(stdout.includes('1 error'));
		assert.ok(stdout.includes('1 warning'));
		assert.ok(stdout.includes('1 hint'));
	});

	it('Checks the directory given by `--root`', async () => {
		const { status, stdout } = runBinary(['--root', './fixture'], testPath);

		assert.strictEqual(status, 1);
		assert.ok(
			stdout.includes(`Getting diagnostics for Astro files in ${fixturePath}`),
			`Expected the fixture directory to be checked, got:\n${stdout}`,
		);
		assert.ok(stdout.includes('1 error'));
	});

	it('Applies the flags given as the first arguments', async () => {
		const { status, stdout } = runBinary(['--minimumSeverity', 'error'], fixturePath);

		assert.strictEqual(status, 1);
		assert.ok(stdout.includes('1 error'));
		assert.ok(!stdout.includes('1 warning'), `Expected warnings to be hidden, got:\n${stdout}`);
		assert.ok(!stdout.includes('1 hint'), `Expected hints to be hidden, got:\n${stdout}`);
	});
});
