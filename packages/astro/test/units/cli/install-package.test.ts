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

	it('reports a package that is installed but throws on import', async () => {
		const projectDir = join(tmpdir(), `astro-test-getpackage-throws-${Date.now()}`);
		const pkgDir = join(projectDir, 'node_modules', 'throwing-test-pkg');

		try {
			await mkdir(pkgDir, { recursive: true });
			await writeFile(
				join(pkgDir, 'package.json'),
				JSON.stringify({
					name: 'throwing-test-pkg',
					version: '1.0.0',
					main: 'index.js',
					type: 'module',
				}),
			);
			await writeFile(join(pkgDir, 'index.js'), "throw new Error('boom');\n");

			const messages: string[] = [];
			const logger = {
				...defaultLogger,
				error: (_label: string, message: string) => messages.push(message),
			};

			const result = await getPackage('throwing-test-pkg', logger as never, { cwd: projectDir });

			assert.equal(result, undefined, 'Expected getPackage to return undefined');
			assert.equal(messages.length, 1, 'Expected exactly one error to be logged');
			assert.match(
				messages[0],
				/installed but could not be loaded/,
				'Expected the error to say the package failed to load, not that it is missing',
			);
			assert.match(messages[0], /boom/, 'Expected the underlying error to be reported');
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});
