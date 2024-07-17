import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { loadFixture } from './test-utils.js';

const createFixture = () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let astroFixture;
	/** @type {Record<string, string>} */
	const writtenFiles = {};

	return {
		/** @param {string} root */
		async whenSyncing(root) {
			astroFixture = await loadFixture({ root });

			const envPath = new URL('env.d.ts', astroFixture.config.srcDir).href;
			const typesDtsPath = new URL('.astro/types.d.ts', astroFixture.config.root).href;

			const fsMock = {
				...fs,
				existsSync(path, ...args) {
					if (path.toString() === envPath) {
						return false;
					}
					if (path.toString() === typesDtsPath) {
						return true;
					}
					return fs.existsSync(path, ...args);
				},
				writeFileSync(path, contents) {
					writtenFiles[path.toString()] = contents;
				},
				promises: {
					...fs.promises,
					async readFile(path, ...args) {
						if (path.toString() === envPath) {
							return `/// <reference path="astro/client" />`;
						} else {
							return fs.promises.readFile(path, ...args);
						}
					},
					async writeFile(path, contents) {
						writtenFiles[path.toString()] = contents;
					},
				},
			};

			await astroFixture.sync({
				inlineConfig: { root: fileURLToPath(new URL(root, import.meta.url)) },
				fs: fsMock,
			});
		},
		/** @param {string} path */
		thenFileShouldExist(path) {
			const expectedPath = new URL(path, astroFixture.config.root).href;
			assert.equal(writtenFiles.hasOwnProperty(expectedPath), true, `${path} does not exist`);
		},
		/**
		 * @param {string} path
		 * @param {string} content
		 * @param {string | undefined} error
		 */
		thenFileContentShouldInclude(path, content, error) {
			const expectedPath = new URL(path, astroFixture.config.root).href;
			assert.equal(writtenFiles[expectedPath].includes(content), true, error);
		},
		thenFileShouldBeValidTypescript(path) {
			const expectedPath = new URL(path, astroFixture.config.root).href;
			try {
				const content = writtenFiles[expectedPath];
				const result = ts.transpileModule(content, {
					compilerOptions: {
						module: ts.ModuleKind.ESNext,
					},
				});
				assert.equal(
					result.outputText,
					'',
					`${path} should be valid TypeScript. Output: ${result.outputText}`
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
	before(async () => {
		fixture = createFixture();
	});

	it('Writes `src/env.d.ts` if none exists', async () => {
		await fixture.whenSyncing('./fixtures/astro-basic/');
		fixture.thenFileShouldExist('src/env.d.ts');
		fixture.thenFileContentShouldInclude('src/env.d.ts', `/// <reference types="astro/client" />`);
	});

	describe('Content collections', () => {
		it('Writes types to `.astro`', async () => {
			await fixture.whenSyncing('./fixtures/content-collections/');
			fixture.thenFileShouldExist('.astro/types.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`declare module 'astro:content' {`,
				'Types file does not include `astro:content` module declaration'
			);
			fixture.thenFileShouldBeValidTypescript('.astro/types.d.ts');
		});

		it('Writes types for empty collections', async () => {
			await fixture.whenSyncing('./fixtures/content-collections-empty-dir/');
			fixture.thenFileShouldExist('.astro/types.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`"blog": Record<string, {
  id: string;
  slug: string;
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">;
  render(): Render[".md"];
}>;`,
				'Types file does not include empty collection type'
			);
			fixture.thenFileContentShouldInclude(
				'.astro/types.d.ts',
				`"blogMeta": Record<string, {
  id: string;
  collection: "blogMeta";
  data: InferEntrySchema<"blogMeta">;
}>;`,
				'Types file does not include empty collection type'
			);
		});

		it('Adds type reference to `src/env.d.ts`', async () => {
			await fixture.whenSyncing('./fixtures/content-collections/');
			fixture.thenFileShouldExist('src/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'src/env.d.ts',
				`/// <reference path="../.astro/types.d.ts" />`
			);
		});
	});

	describe('Astro Env', () => {
		it('Writes types to `.astro`', async () => {
			await fixture.whenSyncing('./fixtures/astro-env/');
			fixture.thenFileShouldExist('.astro/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'.astro/env.d.ts',
				`declare module 'astro:env/client' {`,
				'Types file does not include `astro:env` module declaration'
			);
		});

		it('Adds type reference to `src/env.d.ts`', async () => {
			await fixture.whenSyncing('./fixtures/astro-env/');
			fixture.thenFileShouldExist('src/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'src/env.d.ts',
				`/// <reference path="../.astro/env.d.ts" />`
			);
		});

		it('Does not throw if a public variable is required', async () => {
			let error = null;
			try {
				await fixture.whenSyncing('./fixtures/astro-env-required-public/');
			} catch (e) {
				error = e;
			}

			assert.equal(error, null, 'Syncing should not throw astro:env validation errors');
		});
	});

	describe('Astro Actions', () => {
		// We can't check for the file existence or content yet because
		// it's an integration and does not use the fs mock

		it('Adds type reference to `src/env.d.ts`', async () => {
			await fixture.whenSyncing('./fixtures/actions/');
			fixture.thenFileShouldExist('src/env.d.ts');
			fixture.thenFileContentShouldInclude(
				'src/env.d.ts',
				`/// <reference path="../.astro/actions.d.ts" />`
			);
		});
	});
});
