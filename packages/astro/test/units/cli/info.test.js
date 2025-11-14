// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPackageManager } from '../../../dist/cli/info/core/get-package-manager.js';
import { infoCommand } from '../../../dist/cli/info/core/info.js';
import { createSpyLogger } from '../test-utils.js';
import {
	createFakeDebugInfoProvider,
	createFakePackageManagerUserAgentProvider,
	createPassthroughCommandRunner,
	createSpyClipboard,
	createSpyCommandExecutor,
} from './utils.js';

describe('CLI info', () => {
	describe('core', () => {
		describe('infoCommand', () => {
			it('logs pretty debug info', async () => {
				const { logger, logs } = createSpyLogger();
				const runner = createPassthroughCommandRunner();
				const debugInfoProvider = createFakeDebugInfoProvider([['foo', 'bar']]);
				const { clipboard } = createSpyClipboard();

				await runner.run(infoCommand, {
					debugInfoProvider,
					getDebugInfoFormatter: ({ pretty }) => ({
						format: (debugInfo) => `${pretty}-${JSON.stringify(debugInfo)}`,
					}),
					clipboard,
					logger,
				});

				assert.equal(logs[0].type, 'info');
				assert.equal(logs[0].message, 'true-[["foo","bar"]]');
			});

			it('copies raw debug info', async () => {
				const { logger } = createSpyLogger();
				const runner = createPassthroughCommandRunner();
				const debugInfoProvider = createFakeDebugInfoProvider([['foo', 'bar']]);
				const { clipboard, texts } = createSpyClipboard();

				await runner.run(infoCommand, {
					debugInfoProvider,
					getDebugInfoFormatter: ({ pretty }) => ({
						format: (debugInfo) => `${pretty}-${JSON.stringify(debugInfo)}`,
					}),
					clipboard,
					logger,
				});

				assert.deepStrictEqual(texts, ['false-[["foo","bar"]]']);
			});
		});

		describe('getPackageManager()', () => {
			it('returns noop if there is no user agent', async () => {
				const packageManagerUserAgentProvider = createFakePackageManagerUserAgentProvider(null);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(inputs, []);
				assert.equal(packageManager.getName(), 'unknown');
			});

			it('handles pnpm', async () => {
				const packageManagerUserAgentProvider = createFakePackageManagerUserAgentProvider(
					'pnpm/7.18.1 node/v16.17.0 linux x64',
				);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(inputs, []);
				assert.equal(packageManager.getName(), 'pnpm');
			});

			it('handles npm', async () => {
				const packageManagerUserAgentProvider = createFakePackageManagerUserAgentProvider(
					'npm/8.19.2 node/v16.17.0 linux x64',
				);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(inputs, []);
				assert.equal(packageManager.getName(), 'npm');
			});

			it('handles yarn', async () => {
				const packageManagerUserAgentProvider = createFakePackageManagerUserAgentProvider(
					'yarn/1.22.19 npm/? node/v16.17.0 linux x64',
				);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(inputs, []);
				assert.equal(packageManager.getName(), 'yarn');
			});

			it('handles bun', async () => {
				const packageManagerUserAgentProvider =
					createFakePackageManagerUserAgentProvider('bun/0.5.9 linux x64');
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(inputs, []);
				assert.equal(packageManager.getName(), 'bun');
			});

			it('returns a noop for unknown user agents', async () => {
				const packageManagerUserAgentProvider = createFakePackageManagerUserAgentProvider(
					'npminstall/5.0.0 npm/8.19.2 node/v16.17.0 linux x64',
				);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(inputs, []);
				assert.equal(packageManager.getName(), 'unknown');
			});
		});
	});

	describe('infra', () => {});
});
