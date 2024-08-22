// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';

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
	rmSync(new URL('./tsconfig.json', root), { force: true });
	rmSync(new URL('./src/env.d.ts', root), { force: true });
	rmSync(new URL('./.astro', root), { force: true, recursive: true });

	return {
		sync: () => astroFixture.sync({ root: stringRoot, ...config }),
		/** @param {string} path */
		fileExists: (path) => {
			return existsSync(new URL(path, root));
		},
	};
};

describe('experimental.typescript', () => {
	it('should create .astro/tsconfig.json if experimental.typescript is enabled', async () => {
		const fixture = await createFixture({ experimental: { typescript: {} } });
		await fixture.sync();
		assert.equal(fixture.fileExists('./.astro/tsconfig.json'), true);
	});

	it('should not create src/env.d.ts if experimental.typescript is enabled', async () => {
		// TODO:
	});

	it('should not create .astro/tsconfig.json if experimental.typescript is disabled', async () => {
		// TODO:
	});

	it('should create src/env.d.ts if experimental.typescript is disabled', async () => {
		// TODO:
	});

	it('should throw if tsconfig.json has invalid extends', async () => {
		// TODO:
	});

	it('should throw if tsconfig.json has invalid include', async () => {
		// TODO:
	});

	it('should throw if tsconfig.json has invalid exclude', async () => {
		// TODO:
	});

	it('should add outDir to .astro/tsconfig.json', async () => {
		// TODO:
	});

	it('should handle include/exclude relative paths', async () => {
		// TODO:
	});

	it('should work with astro check', async () => {
		// TODO:
	});

	it('should work in dev', async () => {
		// TODO:
	});

	it('should work in build', async () => {
		// TODO:
	});

	it('should work in sync', async () => {
		// TODO:
	});

	it('should create a tsconfig.json if it does not exist yet', async () => {
		// TODO:
	});
});
