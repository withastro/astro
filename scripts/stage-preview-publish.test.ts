import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

const fixtureDir: string = join(import.meta.dirname, '_test-fixture-preview');
const outputDir: string = join(import.meta.dirname, '_test-output-preview');
const scriptPath: string = join(import.meta.dirname, 'stage-preview-publish.ts');

describe('stage-preview-publish', () => {
	before(() => {
		// Create a fake workspace with a package
		rmSync(fixtureDir, { recursive: true, force: true });
		rmSync(outputDir, { recursive: true, force: true });

		mkdirSync(join(fixtureDir, 'packages', 'astro', 'dist'), { recursive: true });
		mkdirSync(join(fixtureDir, 'packages', 'astro', 'test'), { recursive: true });
		mkdirSync(join(fixtureDir, 'packages', 'astro', 'src'), { recursive: true });
		mkdirSync(join(fixtureDir, 'packages', 'astro', 'node_modules'), { recursive: true });
		writeFileSync(
			join(fixtureDir, 'packages', 'astro', 'package.json'),
			JSON.stringify({ name: 'astro', version: '1.0.0' }),
		);
		writeFileSync(join(fixtureDir, 'packages', 'astro', 'dist', 'index.js'), '// built');
		writeFileSync(join(fixtureDir, 'packages', 'astro', 'test', 'test.js'), '// test');
		writeFileSync(join(fixtureDir, 'packages', 'astro', 'src', 'index.ts'), '// src');
		writeFileSync(join(fixtureDir, 'packages', 'astro', 'node_modules', 'dep.js'), '// dep');
	});

	after(() => {
		rmSync(fixtureDir, { recursive: true, force: true });
		rmSync(outputDir, { recursive: true, force: true });
	});

	test('stages affected packages with synthetic configs', () => {
		execSync(`node ${scriptPath} ${outputDir}`, {
			cwd: fixtureDir,
			env: {
				...process.env,
				AFFECTED_PACKAGES: JSON.stringify(['packages/astro']),
			},
		});

		// Synthetic package.json exists and has no workspace:* deps
		const pkg = JSON.parse(readFileSync(join(outputDir, 'package.json'), 'utf8'));
		assert.equal(pkg.name, 'root');
		assert.equal(pkg.private, true);
		assert.equal(pkg.dependencies, undefined);

		// Synthetic pnpm-workspace.yaml exists with just the packages glob
		const workspace: string = readFileSync(join(outputDir, 'pnpm-workspace.yaml'), 'utf8');
		assert.ok(workspace.includes('packages:'));
		assert.ok(workspace.includes('packages/**/*'));
		assert.ok(!workspace.includes('patchedDependencies'));

		// Affected package was copied
		const astroPkg = JSON.parse(
			readFileSync(join(outputDir, 'packages', 'astro', 'package.json'), 'utf8'),
		);
		assert.equal(astroPkg.name, 'astro');

		// Built output was copied
		assert.ok(existsSync(join(outputDir, 'packages', 'astro', 'dist', 'index.js')));

		// Excluded directories were not copied
		assert.ok(!existsSync(join(outputDir, 'packages', 'astro', 'test')));
		assert.ok(!existsSync(join(outputDir, 'packages', 'astro', 'src')));
		assert.ok(!existsSync(join(outputDir, 'packages', 'astro', 'node_modules')));

		// affected-packages.json was written
		const affected: string[] = JSON.parse(
			readFileSync(join(outputDir, 'affected-packages.json'), 'utf8'),
		);
		assert.deepEqual(affected, ['packages/astro']);
	});

	test('exits with error when no staging dir provided', () => {
		assert.throws(
			() => execSync(`node ${scriptPath}`, { cwd: fixtureDir, stdio: 'pipe' }),
			(err: any) => err.status === 1,
		);
	});

	test('exits with error when AFFECTED_PACKAGES is empty', () => {
		assert.throws(
			() =>
				execSync(`node ${scriptPath} ${outputDir}`, {
					cwd: fixtureDir,
					env: { ...process.env, AFFECTED_PACKAGES: '[]' },
					stdio: 'pipe',
				}),
			(err: any) => err.status === 1,
		);
	});
});
