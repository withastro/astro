// @ts-check
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { getPackageManager } from '../../../dist/cli/info/core/get-package-manager.js';
import { infoCommand } from '../../../dist/cli/info/core/info.js';
import { createCliClipboard } from '../../../dist/cli/info/infra/cli-clipboard.js';
import { createProcessOperatingSystemProvider } from '../../../dist/cli/infra/process-operating-system-provider.js';
import { createTinyexecCommandExecutor } from '../../../dist/cli/infra/tinyexec-command-executor.js';
import { createSpyLogger } from '../test-utils.js';
import {
	createFakeDebugInfoProvider,
	createFakeOperatingSystemProvider,
	createFakePackageManagerUserAgentProvider,
	createFakePrompt,
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

	describe('infra', () => {
		describe('createCliClipboard()', () => {
			function readFromClipboard() {
				const system = process.platform;
				let command = '';
				/** @type {Array<string>} */
				let args = [];

				if (system === 'darwin') {
					command = 'pbpaste';
				} else if (system === 'win32') {
					command = 'powershell';
					args = ['-command', 'Get-Clipboard'];
				} else {
					/** @type {Array<[string, Array<string>]>} */
					const unixCommands = [
						['xclip', ['-sel', 'clipboard', '-o']],
						['wl-paste', []],
					];
					for (const [unixCommand, unixArgs] of unixCommands) {
						try {
							const output = spawnSync('which', [unixCommand], { encoding: 'utf8' });
							if (output.stdout.trim()) {
								command = unixCommand;
								args = unixArgs;
								break;
							}
						} catch {
							continue;
						}
					}
				}

				if (!command) {
					throw new Error('Clipboard read command not found!');
				}

				const result = spawnSync(command, args, { encoding: 'utf8' });
				if (result.error) {
					throw result.error;
				}
				return result.stdout.trim();
			}

			it('aborts early if no copy command can be found', async () => {
				const { commandExecutor, inputs } = createSpyCommandExecutor({ fail: true });
				const { logger, logs } = createSpyLogger();
				const operatingSystemProvider = createFakeOperatingSystemProvider('aix');
				const prompt = createFakePrompt(true);

				const clipboard = createCliClipboard({
					commandExecutor,
					logger,
					operatingSystemProvider,
					prompt,
				});
				await clipboard.copy('foo bar');

				assert.equal(inputs.length, 2);
				assert.equal(logs[0].type, 'warn');
				assert.equal(logs[0].message, 'Clipboard command not found!');
				assert.equal(logs[1].type, 'info');
				assert.equal(logs[1].message, 'Please manually copy the text above.');
			});

			it('aborts if user does not confirm', async () => {
				const { commandExecutor } = createSpyCommandExecutor();
				const { logger, logs } = createSpyLogger();
				const operatingSystemProvider = createFakeOperatingSystemProvider('win32');
				const prompt = createFakePrompt(false);

				const clipboard = createCliClipboard({
					commandExecutor,
					logger,
					operatingSystemProvider,
					prompt,
				});
				const text = Date.now().toString();
				await clipboard.copy(text);

				assert.equal(logs.length, 0);
				assert.notEqual(readFromClipboard(), text);
			});

			it('copies correctly', async () => {
				const commandExecutor = createTinyexecCommandExecutor();
				const { logger, logs } = createSpyLogger();
				const operatingSystemProvider = createProcessOperatingSystemProvider();
				const prompt = createFakePrompt(true);

				const clipboard = createCliClipboard({
					commandExecutor,
					logger,
					operatingSystemProvider,
					prompt,
				});
				const text = Date.now().toString();
				await clipboard.copy(text);

				assert.equal(logs[0].type, 'info');
				assert.equal(logs[0].message, 'Copied to clipboard!');
				assert.equal(readFromClipboard(), text);
			});
		});

		// TODO: createCliDebugInfoProvider
		// TODO: createDevDebugInfoProvider
		// TODO: createNpmPackageManagerUserAgentProvider
		// TODO: createNpmPackageManagerUserAgentProvider
	});
});
