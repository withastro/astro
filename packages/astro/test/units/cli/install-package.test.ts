import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { getPackage } from '../../../dist/cli/install-package.js';
import { defaultLogger } from '../test-utils.ts';

describe('CLI install-package', () => {
	describe('getPackage()', () => {
		const packageName = '@astro-test/cwd-only-pkg';
		let projectDir: string;

		before(() => {
			// Create a project whose dependency lives only in its own node_modules,
			// i.e. somewhere Astro's own module resolution cannot reach.
			projectDir = mkdtempSync(join(tmpdir(), 'astro-get-package-'));
			const pkgDir = join(projectDir, 'node_modules', '@astro-test', 'cwd-only-pkg');
			mkdirSync(pkgDir, { recursive: true });
			writeFileSync(
				join(pkgDir, 'package.json'),
				JSON.stringify({ name: packageName, version: '1.0.0', type: 'module', main: 'index.js' }),
			);
			writeFileSync(join(pkgDir, 'index.js'), 'export const marker = "loaded-from-cwd";\n');
		});

		after(() => {
			rmSync(projectDir, { recursive: true, force: true });
		});

		it('resolves a dependency from the provided cwd, not from Astro’s own location', async () => {
			const pkg = await getPackage<{ marker: string }>(packageName, defaultLogger, {
				cwd: projectDir,
				optional: true,
				skipAsk: true,
			});

			assert.ok(pkg, 'expected the package to be resolved from the project cwd');
			assert.equal(pkg.marker, 'loaded-from-cwd');
		});
	});
});
