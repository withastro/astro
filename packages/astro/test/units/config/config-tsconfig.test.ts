import * as assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { toJson } from 'tsconfck';
import { loadTSConfig, updateTSConfigForFramework } from '../../../dist/core/config/index.js';
import type { frameworkWithTSSettings } from '../../../dist/core/config/tsconfig.js';

const cwd = fileURLToPath(new URL('../../fixtures/tsconfig-handling/', import.meta.url));

/** Assert that loadTSConfig returned a valid result (not an error string). */
function assertValidConfig(
	config: Awaited<ReturnType<typeof loadTSConfig>>,
): asserts config is Exclude<typeof config, string> {
	assert.ok(typeof config !== 'string', `Expected a valid config but got error: ${config}`);
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
			assert.deepEqual(config.tsconfig.files, ['im-a-test']);
		});

		it('can fall back to jsconfig.json if tsconfig.json does not exist', async () => {
			const config = await loadTSConfig(path.join(cwd, 'jsconfig'));
			assertValidConfig(config);
			assert.equal(config.tsconfigFile, path.join(cwd, 'jsconfig', 'jsconfig.json'));
			assert.deepEqual(config.tsconfig.files, ['im-a-test-js']);
		});

		it('properly return errors when not resolving', async () => {
			const invalidConfig = await loadTSConfig(path.join(cwd, 'invalid'));
			const missingConfig = await loadTSConfig(path.join(cwd, 'missing'));

			assert.equal(invalidConfig, 'invalid-config');
			assert.equal(missingConfig, 'missing-config');
		});

		it('does not change baseUrl in raw config', async () => {
			const loadedConfig = await loadTSConfig(path.join(cwd, 'baseUrl'));
			assertValidConfig(loadedConfig);
			const rawConfig = await readFile(path.join(cwd, 'baseUrl', 'tsconfig.json'), 'utf-8')
				.then(toJson)
				.then((content) => JSON.parse(content));

			assert.deepEqual(loadedConfig.rawConfig, rawConfig);
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
