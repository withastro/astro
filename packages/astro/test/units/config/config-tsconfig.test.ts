import * as assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseJsonc } from 'jsonc-parser';
import {
	loadTSConfig,
	updateTSConfigForFramework,
	type TSConfigLoadedResult,
	type TSConfigResult,
} from '../../../dist/core/config/index.js';
import type { frameworkWithTSSettings } from '../../../dist/core/config/tsconfig.js';

const cwd = fileURLToPath(new URL('../../fixtures/tsconfig-handling/', import.meta.url));

/** Assert that loadTSConfig returned a valid result (not an error string). */
function assertValidConfig(config: TSConfigResult): asserts config is TSConfigLoadedResult {
	assert.ok(!config.error, `Expected a valid config but got error: ${JSON.stringify(config)}`);
}

describe('TSConfig handling', () => {
	describe('tsconfig / jsconfig loading', () => {
		it('can load tsconfig.json', async () => {
			const config = await loadTSConfig(cwd);
			assert.equal(config !== undefined, true);
		});

		it('can resolve tsconfig.json up directories', async () => {
			const config = await loadTSConfig(cwd);
			assertValidConfig(config);
			assert.equal(config.tsconfigFile, path.join(cwd, 'tsconfig.json'));
			assert.deepEqual(config.tsconfig.files, ['./im-a-test']);
		});

		it('can fall back to jsconfig.json if tsconfig.json does not exist', async () => {
			const config = await loadTSConfig(path.join(cwd, 'jsconfig'));
			assertValidConfig(config);
			assert.equal(config.tsconfigFile, path.join(cwd, 'jsconfig', 'jsconfig.json'));
			assert.deepEqual(config.tsconfig.files, ['./im-a-test-js']);
		});

		it('properly return errors when not resolving', async () => {
			const invalidConfig = await loadTSConfig(path.join(cwd, 'invalid'));
			const missingConfig = await loadTSConfig(path.join(cwd, 'missing'));

			assert.equal(invalidConfig.error, 'invalid-config');
			assert.equal(missingConfig.error, 'missing-config');
		});

		it('does not change baseUrl in raw config', async () => {
			const loadedConfig = await loadTSConfig(path.join(cwd, 'baseUrl'));
			assertValidConfig(loadedConfig);
			const rawContent = await readFile(path.join(cwd, 'baseUrl', 'tsconfig.json'), 'utf-8');
			const rawConfig = parseJsonc(rawContent, [], { allowTrailingComma: true });

			assert.deepEqual(loadedConfig.rawConfig, rawConfig);
		});

		it('populates `sources` with the full extends chain, root first', async () => {
			const dir = path.join(cwd, 'extends-chain');
			const config = await loadTSConfig(dir);
			assertValidConfig(config);
			assert.equal(config.sources.length, 3);
			assert.ok(config.sources[0].endsWith('tsconfig.json'));
			assert.ok(config.sources.some((p) => p.endsWith('parent.json')));
			assert.ok(config.sources.some((p) => p.endsWith('grandparent.json')));
		});

		it('resolves extends array form (TS 5.0+)', async () => {
			const dir = path.join(cwd, 'extends-array');
			const config = await loadTSConfig(dir);
			assertValidConfig(config);
			assert.equal(config.tsconfig.compilerOptions?.strict, true);
			assert.equal(config.tsconfig.compilerOptions?.target, 'es2022');
			assert.deepEqual(config.tsconfig.files, ['./own']);
			assert.equal(config.sources.length, 3);
		});
	});

	describe('tsconfig / jsconfig updates', () => {
		it('can update a tsconfig with a framework config', async () => {
			const config = await loadTSConfig(cwd);
			assertValidConfig(config);
			const updatedConfig = updateTSConfigForFramework(config.tsconfig, 'react');

			assert.notEqual(config.tsconfig, 'react-jsx');
			assert.equal(updatedConfig.compilerOptions?.jsx, 'react-jsx');
		});

		it('produce no changes on invalid frameworks', async () => {
			const config = await loadTSConfig(cwd);
			assertValidConfig(config);
			// 'doesnt-exist' is not a valid frameworkWithTSSettings — cast to test fallback behaviour
			const updatedConfig = updateTSConfigForFramework(
				config.tsconfig,
				'doesnt-exist' as frameworkWithTSSettings,
			);

			assert.deepEqual(config.tsconfig, updatedConfig);
		});
	});
});
