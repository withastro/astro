// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

const SRC_ENV_DTS = './src/env.d.ts';
const GENERATED_TSCONFIG_PATH = './.astro/tsconfig.json';

/**
 *
 * @param {Omit<import('../dist/types/public/config.js').AstroUserConfig, "root">} config
 * @returns
 */
const createFixture = async (config = {}) => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	const astroFixture = await loadFixture({ root: './fixtures/astro-tsconfig/', ...config });
	const { root } = astroFixture.config;
	const stringRoot = fileURLToPath(root);
	rmSync(new URL('./tsconfig.json', root), { force: true });
	rmSync(new URL(SRC_ENV_DTS, root), { force: true });
	rmSync(new URL('./.astro/', root), { force: true, recursive: true });

	return {
		sync: () => astroFixture.sync({ root: stringRoot, ...config }),
		build: () => astroFixture.build({ root: stringRoot, ...config }),
		startDevServer: () => astroFixture.startDevServer({ root: stringRoot, ...config }),
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

describe('experimental.tsconfig', () => {
	it('should create .astro/tsconfig.json if experimental.tsconfig is enabled', async () => {
		const fixture = await createFixture({ experimental: { tsconfig: {} } });
		await fixture.sync();
		assert.equal(fixture.fileExists(GENERATED_TSCONFIG_PATH), true);
	});

	it('should not create src/env.d.ts if experimental.tsconfig is enabled', async () => {
		const fixture = await createFixture({ experimental: { tsconfig: {} } });
		await fixture.sync();
		assert.equal(fixture.fileExists(SRC_ENV_DTS), false);
	});

	it('should not create .astro/tsconfig.json if experimental.tsconfig is disabled', async () => {
		const fixture = await createFixture();
		await fixture.sync();
		assert.equal(fixture.fileExists(GENERATED_TSCONFIG_PATH), false);
	});

	it('should create src/env.d.ts if experimental.tsconfig is disabled', async () => {
		const fixture = await createFixture();
		await fixture.sync();
		assert.equal(fixture.fileExists(SRC_ENV_DTS), true);
	});

	it('should add outDir to .astro/tsconfig.json if excludeOutDir is enabled', async () => {
		for (const outDir of ['dist', 'custom']) {
			const fixture = await createFixture({ experimental: { tsconfig: {} }, outDir });
			await fixture.sync();
			const raw = await fixture.readFile(GENERATED_TSCONFIG_PATH);
			const tsconfig = JSON.parse(raw);
			assert.equal(tsconfig.exclude.includes(`../${outDir}`), true);
		}
	});

	it('should not add outDir to .astro/tsconfig.json if excludeOutDir is disabled', async () => {
		for (const outDir of ['dist', 'custom']) {
			const fixture = await createFixture({
				experimental: { tsconfig: { excludeOutDir: false } },
				outDir,
			});
			await fixture.sync();
			const raw = await fixture.readFile(GENERATED_TSCONFIG_PATH);
			const tsconfig = JSON.parse(raw);
			assert.equal(tsconfig.exclude.includes(`../${outDir}`), false);
		}
	});

	it('should handle include/exclude relative paths', async () => {
		const dirs = [
			{ outDir: 'dist', exclude: '../dist' },
			{ outDir: './.astro/dist', exclude: './dist' },
			{ outDir: '../dist', exclude: '../../dist' },
		];

		for (const { outDir, exclude } of dirs) {
			const fixture = await createFixture({ experimental: { tsconfig: {} }, outDir });
			await fixture.sync();
			const raw = await fixture.readFile(GENERATED_TSCONFIG_PATH);
			const tsconfig = JSON.parse(raw);
			assert.equal(tsconfig.exclude.includes(exclude), true);
		}
	});

	it('should work in dev', async () => {
		const fixture = await createFixture({ experimental: { tsconfig: {} } });
		await fixture.writeFile('./tsconfig.json', '{ extends: ["./.astro/tsconfig.json"] }')
		try {
			const devServer = await fixture.startDevServer();
			await devServer.stop();
			assert.ok(true);
		} catch {
			assert.fail();
		}
	});

	it('should work in build', async () => {
		const fixture = await createFixture({ experimental: { tsconfig: {} } });
		await fixture.writeFile('./tsconfig.json', '{ extends: ["./.astro/tsconfig.json"] }');
		try {
			await fixture.build();
			assert.ok(true);
		} catch {
			assert.fail();
		}
	});
});
