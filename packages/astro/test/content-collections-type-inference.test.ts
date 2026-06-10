import assert from 'node:assert/strict';
import { execFileSync, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

const contentConfigStub = `export type ContentConfig = {
	collections: {
		blog: { loader: { schema: import('astro/zod').ZodSchema } };
		legacy: { schema: import('astro/zod').ZodSchema };
		schemaless: { loader: {} };
	};
};`;

const ambientModuleStubs = `
declare module 'astro/runtime/server/index.js' {
	export interface AstroComponentFactory {}
}

declare module 'astro' {
	export interface MarkdownHeading {}
	export interface LiveDataEntry<TData extends Record<string, any> = Record<string, any>> {
		id: string;
		data: TData;
	}
	export interface LiveDataCollectionResult<
		TData extends Record<string, any> = Record<string, any>,
		TError extends Error = Error,
	> {
		entries?: Array<LiveDataEntry<TData>>;
		error?: TError | Error;
	}
	export interface LiveDataEntryResult<
		TData extends Record<string, any> = Record<string, any>,
		TError extends Error = Error,
	> {
		entry?: LiveDataEntry<TData>;
		error?: TError | Error;
	}
}

declare module 'astro/zod' {
	export interface ZodSchema {}
	export interface ZodString {}
	export interface ZodTransform<Output = any, Input = any> {}
	export interface ZodPipe<A = any, B = any> {}
	export type infer<T> = any;
	export type output<T> = any;
}

declare module 'astro/loaders' {
	export interface LiveLoader<
		TData extends Record<string, any> = Record<string, any>,
		TEntryFilter extends Record<string, any> | never = never,
		TCollectionFilter extends Record<string, any> | never = never,
		TError extends Error = Error,
	> {}
}
`;

function assertGeneratedContentDtsTypeChecks(contentDts: string) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-content-dts-'));
	const tscPath = fileURLToPath(
		new URL('../../../node_modules/typescript/bin/tsc', import.meta.url),
	);
	const source = `${ambientModuleStubs}\n${contentDts.replace(
		/export type ContentConfig = typeof import\([^;]+;/,
		contentConfigStub,
	)}`;

	try {
		fs.writeFileSync(path.join(tempDir, 'content.d.ts'), source);
		execFileSync(
			process.execPath,
			[
				tscPath,
				'--noEmit',
				'--skipLibCheck',
				'false',
				'--strict',
				'--moduleResolution',
				'bundler',
				'--module',
				'ESNext',
				'--target',
				'ESNext',
				'content.d.ts',
			],
			{ cwd: tempDir, encoding: 'utf-8', stdio: 'pipe' },
		);
	} catch (err) {
		const stdout = (err as { stdout?: string }).stdout ?? '';
		const stderr = (err as { stderr?: string }).stderr ?? '';
		assert.fail(
			`Generated content.d.ts failed declaration checking.\n\nstdout:\n${stdout}\n\nstderr:\n${stderr}`,
		);
	} finally {
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
}

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
			const stdout = (err as { stdout?: string }).stdout ?? '';
			const stderr = (err as { stderr?: string }).stderr ?? '';
			assert.fail(
				`TypeScript type-checking failed on fixture.\n` +
					`This means the content collection type inference is broken.\n\n` +
					`stdout:\n${stdout}\n\nstderr:\n${stderr}`,
			);
		}
	});

	it('generates content.d.ts that passes declaration checking', () => {
		const contentDts = fs.readFileSync(
			new URL('./.astro/content.d.ts', fixture.config.root),
			'utf-8',
		);

		assertGeneratedContentDtsTypeChecks(contentDts);
	});
});
