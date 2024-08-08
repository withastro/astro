// @ts-check
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { normalizePath } from 'vite';
import { loadFixture } from './test-utils.js';

const createFixture = () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let astroFixture;
	/** @type {Record<string, string>} */
	const writtenFiles = {};

	/**
	 * @param {string} path
	 */
	const getExpectedPath = (path) =>
		normalizePath(fileURLToPath(new URL(path, astroFixture.config.root)));

	return {
		/** @param {string} root */
		async load(root) {
			astroFixture = await loadFixture({ root });
			return astroFixture.config;
		},
		clean() {
			const envPath = new URL('env.d.ts', astroFixture.config.srcDir);
			if (fs.existsSync(envPath)) {
				fs.unlinkSync(new URL('env.d.ts', astroFixture.config.srcDir));
			}
			fs.rmSync(new URL('./.astro/', astroFixture.config.root), { force: true, recursive: true });
		},
		async whenSyncing() {
			const fsMock = {
				...fs,
				/**
				 * @param {fs.PathLike} path
				 * @param {string} contents
				 */
				writeFileSync(path, contents) {
					writtenFiles[path.toString()] = contents;
					return fs.writeFileSync(path, contents);
				},
				promises: {
					...fs.promises,
					/**
					 * @param {fs.PathLike} path
					 * @param {string} contents
					 */
					writeFile(path, contents) {
						writtenFiles[path.toString()] = contents;
						return fs.promises.writeFile(path, contents);
					},
				},
			};

			await astroFixture.sync(
				{ root: fileURLToPath(astroFixture.config.root) },
				{
					// @ts-ignore
					fs: fsMock,
				},
			);
		},
		/** @param {string} path */
		thenFileShouldExist(path) {
			assert.equal(
				writtenFiles.hasOwnProperty(getExpectedPath(path)),
				true,
				`${path} does not exist`,
			);
		},
		/**
		 * @param {string} path
		 * @param {string} content
		 * @param {string | undefined} error
		 */
		thenFileContentShouldInclude(path, content, error = undefined) {
			assert.equal(writtenFiles[getExpectedPath(path)].includes(content), true, error);
		},
		/**
		 * @param {string} path
		 */
		thenFileShouldBeValidTypescript(path) {
			try {
				const content = writtenFiles[getExpectedPath(path)];
				const result = ts.transpileModule(content, {
					compilerOptions: {
						module: ts.ModuleKind.ESNext,
					},
				});
				assert.equal(
					result.outputText,
					'',
					`${path} should be valid TypeScript. Output: ${result.outputText}`,
				);
			} catch (error) {
				assert.fail(`${path} is not valid TypeScript. Error: ${error.message}`);
			}
		},
	};
};

describe('astro sync', () => {
	/** @type {ReturnType<typeof createFixture>} */
	let fixture;
	beforeEach(async () => {
		fixture = createFixture();
	});

	describe('References', () => {
		it('Writes `src/env.d.ts` if none exists', async () => {
			await fixture.load('./fixtures/astro-basic/');
			fixture.clean();
			await fixture.whenSyncing();
			fixture.thenFileShouldExist('src/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'src/env.d.ts',
				`/// <reference path="../.astro/types.d.ts" />`,
			);
		});

		it('Updates `src/env.d.ts` if one exists', async () => {
			const config = await fixture.load('./fixtures/astro-basic/');
			fixture.clean();
			fs.writeFileSync(new URL('./env.d.ts', config.srcDir), '// whatever', 'utf-8');
			await fixture.whenSyncing();
			fixture.thenFileShouldExist('src/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'src/env.d.ts',
				`/// <reference path="../.astro/types.d.ts" />`,
			);
		});

		it('Writes `src/types.d.ts`', async () => {
			await fixture.load('./fixtures/astro-basic/');
			fixture.clean();
			await fixture.whenSyncing();
			fixture.thenFileShouldExist('.astro/types.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`/// <reference types="astro/client" />`,
			);
		});
	});

	describe('Content collections', () => {
		it('Adds reference to `.astro/types.d.ts`', async () => {
			await fixture.load('./fixtures/content-collections/');
			fixture.clean();
			await fixture.whenSyncing();
			fixture.thenFileShouldExist('.astro/types.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`/// <reference path="astro/content.d.ts" />`,
			);
			fixture.thenFileShouldExist('.astro/astro/content.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/astro/content.d.ts',
				`declare module 'astro:content' {`,
				'Types file does not include `astro:content` module declaration',
			);
			fixture.thenFileShouldBeValidTypescript('.astro/astro/content.d.ts');
		});

		it('Writes types for empty collections', async () => {
			await fixture.load('./fixtures/content-collections-empty-dir/');
			fixture.clean();
			await fixture.whenSyncing();
			fixture.thenFileContentShouldInclude(
				'.astro/astro/content.d.ts',
				`"blog": Record<string, {
      id: string;
      slug: string;
      body: string;
      collection: "blog";
      data: InferEntrySchema<"blog">;
      render(): Render[".md"];
    }>;`,
				'Types file does not include empty collection type',
			);
			fixture.thenFileContentShouldInclude(
				'.astro/astro/content.d.ts',
				`"blogMeta": Record<string, {
      id: string;
      collection: "blogMeta";
      data: InferEntrySchema<"blogMeta">;
    }>`,
				'Types file does not include empty collection type',
			);
		});
	});

	describe('astro:env', () => {
		it('Adds reference to `.astro/types.d.ts`', async () => {
			await fixture.load('./fixtures/astro-env/');
			fixture.clean();
			await fixture.whenSyncing();
			fixture.thenFileShouldExist('.astro/types.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`/// <reference path="astro/env.d.ts" />`,
			);
			fixture.thenFileShouldExist('.astro/astro/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/astro/env.d.ts',
				`declare module 'astro:env/client' {`,
				'Types file does not include `astro:env` module declaration',
			);
		});

		it('Does not throw if a public variable is required', async () => {
			try {
				await fixture.load('./fixtures/astro-env-required-public/');
				fixture.clean();
				await fixture.whenSyncing();
				assert.ok(true);
			} catch {
				assert.fail();
			}
		});
	});

	describe('astro:actions', () => {
		it('Adds reference to `.astro/types.d.ts`', async () => {
			await fixture.load('./fixtures/actions/');
			fixture.clean();
			await fixture.whenSyncing();
			fixture.thenFileShouldExist('.astro/types.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`/// <reference path="astro/actions.d.ts" />`,
			);
			fixture.thenFileShouldExist('.astro/astro/actions.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/astro/actions.d.ts',
				`declare module "astro:actions" {`,
				'Types file does not include `astro:actions` module declaration',
			);
			fixture.thenFileShouldBeValidTypescript('.astro/astro/actions.d.ts');
		});
	});
});
