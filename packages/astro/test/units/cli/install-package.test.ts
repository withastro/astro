import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getPackage } from '../../../dist/cli/install-package.js';
import { defaultLogger } from '../test-utils.ts';

describe('getPackage', () => {
	it('resolves packages from the project cwd, not from astro install location', async () => {
		// Create a temporary directory simulating a project with a fake package
		const projectDir = join(tmpdir(), `astro-test-getpackage-${Date.now()}`);
		const pkgDir = join(projectDir, 'node_modules', 'fake-test-pkg');

		try {
			await mkdir(pkgDir, { recursive: true });
			await writeFile(
				join(pkgDir, 'package.json'),
				JSON.stringify({
					name: 'fake-test-pkg',
					version: '1.0.0',
					main: 'index.js',
					type: 'module',
				}),
			);
			await writeFile(join(pkgDir, 'index.js'), 'export const loaded = true;\n');

			// getPackage should resolve from the project cwd, finding the fake package
			const result = await getPackage<{ loaded: boolean }>('fake-test-pkg', defaultLogger, {
				cwd: projectDir,
				optional: true,
			});

			assert.ok(result, 'Expected getPackage to find the package in the project cwd');
			assert.equal(result.loaded, true, 'Expected the loaded export to be true');
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});
