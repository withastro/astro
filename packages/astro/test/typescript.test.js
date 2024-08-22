// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { AstroError } from '../dist/core/errors/errors.js';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT_TSCONFIG_PATH = './tsconfig.json';
const SRC_ENV_DTS = './src/env.d.ts';
const GENERATED_TSCONFIG_PATH = './.astro/tsconfig.json';

/**
 *
 * @param {Omit<import('../dist/types/public/config.js').AstroUserConfig, "root">} config
 * @returns
 */
const createFixture = async (config = {}) => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	const astroFixture = await loadFixture({ root: './fixtures/astro-typescript/', ...config });
	const { root } = astroFixture.config;
	const stringRoot = fileURLToPath(root);
	rmSync(new URL(ROOT_TSCONFIG_PATH, root), { force: true });
	rmSync(new URL(SRC_ENV_DTS, root), { force: true });
	rmSync(new URL('./.astro/', root), { force: true, recursive: true });

	return {
		sync: () => astroFixture.sync({ root: stringRoot, ...config }),
		/** @param {string} path */
		fileExists: (path) => {
			return existsSync(new URL(path, root));
		},
		/**
		 * @param {string} path
		 * @param {string} content
		 * */
		writeFile: (path, content) => writeFile(new URL(path, root), content, 'utf-8'),
		/** @param {string} path */
		readFile: (path) => readFile(new URL(path, root), 'utf-8'),
	};
};

describe('experimental.typescript', () => {
	it('should create .astro/tsconfig.json if experimental.typescript is enabled', async () => {
		const fixture = await createFixture({ experimental: { typescript: {} } });
		await fixture.sync();
		assert.equal(fixture.fileExists(GENERATED_TSCONFIG_PATH), true);
	});

	it('should not create src/env.d.ts if experimental.typescript is enabled', async () => {
		const fixture = await createFixture({ experimental: { typescript: {} } });
		await fixture.sync();
		assert.equal(fixture.fileExists(SRC_ENV_DTS), false);
	});

	it('should not create .astro/tsconfig.json if experimental.typescript is disabled', async () => {
		const fixture = await createFixture();
		await fixture.sync();
		assert.equal(fixture.fileExists(GENERATED_TSCONFIG_PATH), false);
	});

	it('should create src/env.d.ts if experimental.typescript is disabled', async () => {
		const fixture = await createFixture();
		await fixture.sync();
		assert.equal(fixture.fileExists(SRC_ENV_DTS), true);
	});

	it('should throw if tsconfig.json has invalid extends', async () => {
		const fixture = await createFixture({ experimental: { typescript: {} } });

		const contents = [
			{},
			{ extends: 'astro/tsconfigs/base' },
			{ extends: ['astro/tsconfigs/base'] },
		];
		for (const content of contents) {
			await fixture.writeFile(ROOT_TSCONFIG_PATH, JSON.stringify(content, null, 2));
			try {
				await fixture.sync();
				assert.fail();
			} catch (err) {
				assert.equal(err instanceof AstroError, true);
				assert.equal(err.name, 'TSConfigInvalidExtends');
			}
		}
	});

	it('should throw if tsconfig.json has include', async () => {
		const fixture = await createFixture({ experimental: { typescript: {} } });

		await fixture.writeFile(
			ROOT_TSCONFIG_PATH,
			JSON.stringify({ extends: ['./.astro/tsconfig.json'], include: ['foo'] }, null, 2),
		);
		try {
			await fixture.sync();
			assert.fail();
		} catch (err) {
			assert.equal(err instanceof AstroError, true);
			assert.equal(err.name, 'TSConfigInvalidInclude');
		}
	});

	it('should throw if tsconfig.json has exclude', async () => {
		const fixture = await createFixture({ experimental: { typescript: {} } });

		await fixture.writeFile(
			ROOT_TSCONFIG_PATH,
			JSON.stringify({ extends: ['./.astro/tsconfig.json'], exclude: ['foo'] }, null, 2),
		);
		try {
			await fixture.sync();
			assert.fail();
		} catch (err) {
			assert.equal(err instanceof AstroError, true);
			assert.equal(err.name, 'TSConfigInvalidExclude');
		}
	});

	it('should add outDir to .astro/tsconfig.json', async () => {
		for (const outDir of ['dist', 'custom']) {
			const fixture = await createFixture({ experimental: { typescript: {} }, outDir });
			await fixture.sync();
			const tsconfig = JSON.parse(await fixture.readFile(GENERATED_TSCONFIG_PATH));
			assert.equal(tsconfig.exclude.includes(`../${outDir}`), true);
		}
	});

	it('should handle include/exclude relative paths', async () => {
		const dirs = [
			{ outDir: 'dist', exclude: '../dist' },
			{ outDir: './.astro/dist', exclude: 'dist' },
			{ outDir: '../dist', exclude: '../../dist' },
		];

		for (const { outDir, exclude } of dirs) {
			const fixture = await createFixture({ experimental: { typescript: {} }, outDir });
			await fixture.sync();
			const tsconfig = JSON.parse(await fixture.readFile(GENERATED_TSCONFIG_PATH));
			assert.equal(tsconfig.exclude.includes(exclude), true);
		}
	});

	// it('should work with astro check', async () => {});

	// it('should work in dev', async () => {});

	// it('should work in build', async () => {});

	// it('should work in sync', async () => {});

	// it('should create a tsconfig.json if it does not exist yet', async () => {});
});
