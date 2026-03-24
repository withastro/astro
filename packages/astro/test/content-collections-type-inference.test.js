// @ts-check
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './test-utils.js';

describe('Content collection type inference', () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let fixture;
	/** @type {string} */
	let fixtureRoot;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collections-type-inference/',
		});
		fixtureRoot = fileURLToPath(fixture.config.root);

		// Clean previous .astro directory
		fs.rmSync(new URL('./.astro/', fixture.config.root), { force: true, recursive: true });

		// Run astro sync to generate .astro/content.d.ts from the real template
		await fixture.sync({ root: fixtureRoot });
	});

	it('generates content.d.ts with ExtractLoaderConfig type utility', async () => {
		const contentDts = fs.readFileSync(
			new URL('./.astro/content.d.ts', fixture.config.root),
			'utf-8',
		);
		assert.ok(
			contentDts.includes('ExtractLoaderConfig'),
			'Generated content.d.ts should contain ExtractLoaderConfig type utility',
		);
		assert.ok(
			contentDts.includes('InferLoaderSchema'),
			'Generated content.d.ts should contain InferLoaderSchema type utility',
		);
	});

	it('generates correct DataEntryMap with all three collection types', async () => {
		const contentDts = fs.readFileSync(
			new URL('./.astro/content.d.ts', fixture.config.root),
			'utf-8',
		);
		assert.ok(contentDts.includes('"blog"'), 'DataEntryMap should include "blog" collection');
		assert.ok(contentDts.includes('"legacy"'), 'DataEntryMap should include "legacy" collection');
		assert.ok(
			contentDts.includes('"schemaless"'),
			'DataEntryMap should include "schemaless" collection',
		);
	});

	it('type-checks correctly against the generated types', () => {
		// Run tsc on the fixture to verify the type assertions in src/type-checks.ts
		// pass against the real generated content.d.ts.
		//
		// The type-checks.ts file uses @ts-expect-error to assert that:
		// - Case 1 (loader with schema): data is NOT any, is { test: string }
		// - Case 2 (legacy schema): data is NOT any, is { title: string; legacyField: boolean }
		// - Case 3 (schemaless loader): data IS any (the correct fallback)
		//
		// If any @ts-expect-error is unused (type collapsed to `any` when it shouldn't),
		// tsc will report an error and this test fails.
		try {
			execSync('npx tsc --noEmit', {
				cwd: fixtureRoot,
				stdio: 'pipe',
				encoding: 'utf-8',
			});
		} catch (err) {
			const stdout = /** @type {{ stdout?: string }} */ (err).stdout ?? '';
			const stderr = /** @type {{ stderr?: string }} */ (err).stderr ?? '';
			assert.fail(
				`TypeScript type-checking failed on fixture.\n` +
					`This means the content collection type inference is broken.\n\n` +
					`stdout:\n${stdout}\n\nstderr:\n${stderr}`,
			);
		}
	});
});
