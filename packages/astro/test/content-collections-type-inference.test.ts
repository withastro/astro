import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Content collection type inference', () => {
	let fixture: Fixture;
	let fixtureRoot: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collections-type-inference/',
			outDir: './dist/content-collections-type-inference/',
		});
		fixtureRoot = fileURLToPath(fixture.config.root);

		// Clean previous .astro directory
		fs.rmSync(new URL('./.astro/', fixture.config.root), { force: true, recursive: true });

		// Run astro sync to generate .astro/content.d.ts from the real template
		await fixture.sync({ root: fixtureRoot });
	});

	it('generates a content.d.ts that only points at the config', async () => {
		const contentDts = fs.readFileSync(
			new URL('./.astro/content.d.ts', fixture.config.root),
			'utf-8',
		);
		assert.ok(
			contentDts.includes('typeof import("../src/content.config.js")'),
			'Generated content.d.ts should point `ContentConfig` at the config module',
		);
		// The `astro:content` API itself ships with Astro, so none of it is written per project.
		for (const shouldNotBeGenerated of ['getCollection', 'CollectionEntry', 'RenderedContent']) {
			assert.ok(
				!contentDts.includes(shouldNotBeGenerated),
				`Generated content.d.ts should not declare ${shouldNotBeGenerated}`,
			);
		}
	});

	it('infers the data of collections the config describes', async () => {
		const contentDts = fs.readFileSync(
			new URL('./.astro/content.d.ts', fixture.config.root),
			'utf-8',
		);
		// A collection is named so that `keyof DataMap` is known without resolving the config,
		// but its data is inferred rather than written out — whether the schema is on the
		// collection, on its loader, or missing entirely.
		for (const collection of ['blog', 'legacy', 'schemaless', 'standard', 'referencing']) {
			assert.ok(
				contentDts.includes(
					`"${collection}": InferCollectionData<ContentConfig, "${collection}">;`,
				),
				`${collection} should be inferred from the config`,
			);
		}
	});

	it('writes out the types of a loader that builds its schema while loading', async () => {
		const contentDts = fs.readFileSync(
			new URL('./.astro/content.d.ts', fixture.config.root),
			'utf-8',
		);
		// A `createSchema()` loader has nothing in the config to infer from, so its types are
		// generated into a file of their own and the collection points at it.
		assert.ok(
			contentDts.includes('"dynamic": import("./loaders/dynamic.js").Entry;'),
			'The dynamic collection should point at its generated types',
		);
		const loaderTypes = fs.readFileSync(
			new URL('./.astro/loaders/dynamic.ts', fixture.config.root),
			'utf-8',
		);
		assert.ok(
			loaderTypes.includes('export interface Entry'),
			'The loader types the collection points at should be generated',
		);
	});

	it('type-checks correctly against the generated types', {
		// type definitions are not generated for ecosystem CI
		skip: !!process.env.ECOSYSTEM_CI,
	}, () => {
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
			const stdout = (err as { stdout?: string }).stdout ?? '';
			const stderr = (err as { stderr?: string }).stderr ?? '';
			assert.fail(
				`TypeScript type-checking failed on fixture.\n` +
					`This means the content collection type inference is broken.\n\n` +
					`stdout:\n${stdout}\n\nstderr:\n${stderr}`,
			);
		}
	});
});
