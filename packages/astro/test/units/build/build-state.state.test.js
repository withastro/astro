import * as assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
	clearIncrementalBuildState,
	createIncrementalBuildState,
	loadIncrementalBuildState,
	writeIncrementalBuildState,
} from '../../../dist/core/build/build-state.js';
import {
	createIncrementalBuildSettings,
	createTempRoot,
	getIncrementalStateFile,
} from './test-helpers.ts';
import { SpyLogger } from '../test-utils.ts';

describe('astro/src/core/build/build-state state', () => {
	it('round-trips incremental build state from cacheDir', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const logger = new SpyLogger();
		const state = createIncrementalBuildState({
			settings,
			mode: 'production',
			runtimeMode: 'production',
			pageCount: 3,
			buildTimeMs: 42,
		});

		await writeIncrementalBuildState({ settings, logger, state });

		const loaded = await loadIncrementalBuildState({
			settings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.ok(loaded.previousState);
		assert.equal(loaded.invalidationReason, undefined);
		assert.equal(loaded.previousState.summary.pageCount, 3);
		assert.equal(loaded.previousState.artifacts.outDir, settings.config.outDir.toString());
		assert.equal(loaded.previousState.publicDirDigest, null);
	});

	it('uses different state files for different build consumers in the same cacheDir', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);

		const productionFile = getIncrementalStateFile(settings, 'production', 'production');
		const stagingFile = getIncrementalStateFile(settings, 'staging', 'production');
		const devOutputFile = getIncrementalStateFile(settings, 'production', 'development');

		assert.notEqual(productionFile.toString(), stagingFile.toString());
		assert.notEqual(productionFile.toString(), devOutputFile.toString());
		assert.match(productionFile.toString(), /incremental-build-state\.[a-f0-9]+\.json$/);
	});

	it('invalidates cached state when the Astro config changes', async () => {
		const root = createTempRoot();
		const logger = new SpyLogger();
		const initialSettings = await createIncrementalBuildSettings(root);

		await writeIncrementalBuildState({
			settings: initialSettings,
			logger,
			state: createIncrementalBuildState({
				settings: initialSettings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 1,
				buildTimeMs: 10,
			}),
		});

		const changedSettings = await createIncrementalBuildSettings(root, { base: '/docs/' });
		const loaded = await loadIncrementalBuildState({
			settings: changedSettings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.equal(loaded.previousState, undefined);
		assert.equal(loaded.invalidationReason, 'Astro config changed');
	});

	it('invalidates cached state when the Vite config changes', async () => {
		const root = createTempRoot();
		const logger = new SpyLogger();
		const initialSettings = await createIncrementalBuildSettings(root, {
			vite: {
				define: {
					__FEATURE_FLAG__: JSON.stringify('a'),
				},
			},
		});

		await writeIncrementalBuildState({
			settings: initialSettings,
			logger,
			state: createIncrementalBuildState({
				settings: initialSettings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 1,
				buildTimeMs: 10,
			}),
		});

		const changedSettings = await createIncrementalBuildSettings(root, {
			vite: {
				define: {
					__FEATURE_FLAG__: JSON.stringify('b'),
				},
			},
		});
		const loaded = await loadIncrementalBuildState({
			settings: changedSettings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.equal(loaded.previousState, undefined);
		assert.equal(loaded.invalidationReason, 'Vite config changed');
	});

	it('invalidates cached state when project metadata changes', async () => {
		const root = createTempRoot();
		const logger = new SpyLogger();
		writeFileSync(
			new URL('./package.json', root),
			JSON.stringify({ name: 'incremental-build-test', version: '1.0.0' }, null, 2),
		);
		const initialSettings = await createIncrementalBuildSettings(root);

		await writeIncrementalBuildState({
			settings: initialSettings,
			logger,
			state: createIncrementalBuildState({
				settings: initialSettings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 1,
				buildTimeMs: 10,
			}),
		});

		writeFileSync(
			new URL('./package.json', root),
			JSON.stringify({ name: 'incremental-build-test', version: '1.0.1' }, null, 2),
		);

		const loaded = await loadIncrementalBuildState({
			settings: initialSettings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.equal(loaded.previousState, undefined);
		assert.equal(loaded.invalidationReason, 'project metadata changed');
	});

	it('clears the cached incremental build state', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const logger = new SpyLogger();

		await writeIncrementalBuildState({
			settings,
			logger,
			state: createIncrementalBuildState({
				settings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 2,
				buildTimeMs: 12,
			}),
		});
		await writeIncrementalBuildState({
			settings,
			logger,
			state: createIncrementalBuildState({
				settings,
				mode: 'staging',
				runtimeMode: 'production',
				pageCount: 2,
				buildTimeMs: 12,
			}),
		});

		const productionStateFile = getIncrementalStateFile(settings);
		const stagingStateFile = getIncrementalStateFile(settings, 'staging', 'production');
		assert.equal(existsSync(productionStateFile), true);
		assert.equal(existsSync(stagingStateFile), true);

		await clearIncrementalBuildState({ settings, logger });

		assert.equal(existsSync(productionStateFile), false);
		assert.equal(existsSync(stagingStateFile), false);
	});
});
