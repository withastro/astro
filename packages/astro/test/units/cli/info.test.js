// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPackageManager } from '../../../dist/cli/info/core/get-package-manager.js';
import { infoCommand } from '../../../dist/cli/info/core/info.js';
import { CliClipboard } from '../../../dist/cli/info/infra/cli-clipboard.js';
import { CliDebugInfoProvider } from '../../../dist/cli/info/infra/cli-debug-info-provider.js';
import { DevDebugInfoProvider } from '../../../dist/cli/info/infra/dev-debug-info-provider.js';
import { ProcessNodeVersionProvider } from '../../../dist/cli/info/infra/process-node-version-provider.js';
import { ProcessPackageManagerUserAgentProvider } from '../../../dist/cli/info/infra/process-package-manager-user-agent-provider.js';
import { SpyLogger } from '../test-utils.js';
import {
	FakeAstroVersionProvider,
	FakeDebugInfoProvider,
	FakeNodeVersionProvider,
	FakeOperatingSystemProvider,
	FakePackageManagerUserAgentProvider,
	FakePrompt,
	PassthroughCommandRunner,
	SpyClipboard,
	SpyCommandExecutor,
} from './utils.js';

describe('CLI info', () => {
	describe('core', () => {
		describe('infoCommand', () => {
			it('logs pretty debug info', async () => {
				const logger = new SpyLogger();
				const runner = new PassthroughCommandRunner();
				const debugInfoProvider = new FakeDebugInfoProvider([['foo', 'bar']]);
				const clipboard = new SpyClipboard();

				await runner.run(infoCommand, {
					debugInfoProvider,
					getDebugInfoFormatter: ({ pretty }) => ({
						format: (debugInfo) => `${pretty}-${JSON.stringify(debugInfo)}`,
					}),
					clipboard,
					logger,
				});

				assert.equal(logger.logs[0].type, 'info');
				assert.equal(logger.logs[0].message, 'true-[["foo","bar"]]');
			});

			it('copies raw debug info', async () => {
				const logger = new SpyLogger();
				const runner = new PassthroughCommandRunner();
				const debugInfoProvider = new FakeDebugInfoProvider([['foo', 'bar']]);
				const clipboard = new SpyClipboard();

				await runner.run(infoCommand, {
					debugInfoProvider,
					getDebugInfoFormatter: ({ pretty }) => ({
						format: (debugInfo) => `${pretty}-${JSON.stringify(debugInfo)}`,
					}),
					clipboard,
					logger,
				});

				assert.deepStrictEqual(clipboard.texts, ['false-[["foo","bar"]]']);
			});
		});

		describe('getPackageManager()', () => {
			it('returns noop if there is no user agent', async () => {
				const packageManagerUserAgentProvider = new FakePackageManagerUserAgentProvider(null);
				const commandExecutor = new SpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(commandExecutor.inputs, []);
				assert.equal(packageManager.name, 'unknown');
			});

			it('handles pnpm', async () => {
				const packageManagerUserAgentProvider = new FakePackageManagerUserAgentProvider(
					'pnpm/7.18.1 node/v16.17.0 linux x64',
				);
				const commandExecutor = new SpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(commandExecutor.inputs, []);
				assert.equal(packageManager.name, 'pnpm');
			});

			it('handles npm', async () => {
				const packageManagerUserAgentProvider = new FakePackageManagerUserAgentProvider(
					'npm/8.19.2 node/v16.17.0 linux x64',
				);
				const commandExecutor = new SpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(commandExecutor.inputs, []);
				assert.equal(packageManager.name, 'npm');
			});

			it('handles yarn', async () => {
				const packageManagerUserAgentProvider = new FakePackageManagerUserAgentProvider(
					'yarn/1.22.19 npm/? node/v16.17.0 linux x64',
				);
				const commandExecutor = new SpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(commandExecutor.inputs, []);
				assert.equal(packageManager.name, 'yarn');
			});

			it('handles bun', async () => {
				const packageManagerUserAgentProvider = new FakePackageManagerUserAgentProvider(
					'bun/0.5.9 linux x64',
				);
				const commandExecutor = new SpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(commandExecutor.inputs, []);
				assert.equal(packageManager.name, 'bun');
			});

			it('returns a noop for unknown user agents', async () => {
				const packageManagerUserAgentProvider = new FakePackageManagerUserAgentProvider(
					'npminstall/5.0.0 npm/8.19.2 node/v16.17.0 linux x64',
				);
				const commandExecutor = new SpyCommandExecutor();

				const packageManager = await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				});

				assert.deepStrictEqual(commandExecutor.inputs, []);
				assert.equal(packageManager.name, 'unknown');
			});
		});
	});

	describe('infra', () => {
		describe('CliClipboard', () => {
			it('aborts early if no copy command can be found', async () => {
				const commandExecutor = new SpyCommandExecutor({ fail: true });
				const logger = new SpyLogger();
				const operatingSystemProvider = new FakeOperatingSystemProvider('aix');
				const prompt = new FakePrompt(true);

				const clipboard = new CliClipboard({
					commandExecutor,
					logger,
					operatingSystemProvider,
					prompt,
				});
				await clipboard.copy('foo bar');

				assert.equal(commandExecutor.inputs.length, 2);
				assert.equal(logger.logs[0].type, 'warn');
				assert.equal(logger.logs[0].message, 'Clipboard command not found!');
				assert.equal(logger.logs[1].type, 'info');
				assert.equal(logger.logs[1].message, 'Please manually copy the text above.');
			});

			it('aborts if user does not confirm', async () => {
				const commandExecutor = new SpyCommandExecutor();
				const logger = new SpyLogger();
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const prompt = new FakePrompt(false);

				const clipboard = new CliClipboard({
					commandExecutor,
					logger,
					operatingSystemProvider,
					prompt,
				});
				const text = Date.now().toString();
				await clipboard.copy(text);

				assert.equal(logger.logs.length, 0);
				assert.equal(commandExecutor.inputs.length, 0);
			});

			it('copies correctly', async () => {
				const commandExecutor = new SpyCommandExecutor();
				const logger = new SpyLogger();
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const prompt = new FakePrompt(true);

				const clipboard = new CliClipboard({
					commandExecutor,
					logger,
					operatingSystemProvider,
					prompt,
				});
				const text = Date.now().toString();
				await clipboard.copy(text);

				assert.equal(logger.logs[0].type, 'info');
				assert.equal(logger.logs[0].message, 'Copied to clipboard!');
				assert.equal(commandExecutor.inputs.length, 1);
				assert.deepStrictEqual(commandExecutor.inputs[0], {
					command: 'clip',
					args: undefined,
					input: text,
				});
			});
		});

		describe('CliDebugInfoProvider', () => {
			it('returns basic infos', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new CliDebugInfoProvider({
					config: {
						output: 'static',
						adapter: undefined,
						integrations: [],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async () => {
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', 'none'],
					['Integrations', 'none'],
				]);
			});

			it('handles the vite version', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new CliDebugInfoProvider({
					config: {
						output: 'static',
						adapter: undefined,
						integrations: [],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async (name) => {
							if (name === 'vite') {
								return 'v1.2.3';
							}
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Vite', 'v1.2.3'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', 'none'],
					['Integrations', 'none'],
				]);
			});

			it('handles the adapter with no version', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new CliDebugInfoProvider({
					config: {
						output: 'static',
						adapter: {
							name: '@astrojs/node',
							hooks: {},
						},
						integrations: [],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async () => {
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', '@astrojs/node'],
					['Integrations', 'none'],
				]);
			});

			it('handles the adapter version', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new CliDebugInfoProvider({
					config: {
						output: 'static',
						adapter: {
							name: '@astrojs/node',
							hooks: {},
						},
						integrations: [],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async (name) => {
							if (name === '@astrojs/node') {
								return 'v6.5.4';
							}
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', '@astrojs/node (v6.5.4)'],
					['Integrations', 'none'],
				]);
			});

			it('handles integrations', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new CliDebugInfoProvider({
					config: {
						output: 'static',
						adapter: undefined,
						integrations: [
							{
								name: 'foo',
								hooks: {},
							},
							{
								name: 'bar',
								hooks: {},
							},
						],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async (name) => {
							if (name === 'bar') {
								return 'v6.6.6';
							}
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', 'none'],
					['Integrations', ['foo', 'bar (v6.6.6)']],
				]);
			});
		});

		describe('DevDebugInfoProvider', () => {
			it('works', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new DevDebugInfoProvider({
					config: {
						output: 'static',
						adapter: undefined,
						integrations: [],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async () => {
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', 'none'],
					['Integrations', 'none'],
				]);
			});

			it('handles the adapter', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new DevDebugInfoProvider({
					config: {
						output: 'static',
						adapter: {
							name: '@astrojs/node',
							hooks: {},
						},
						integrations: [],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async () => {
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', '@astrojs/node'],
					['Integrations', 'none'],
				]);
			});

			it('handles integrations', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				const debugInfoProvider = new DevDebugInfoProvider({
					config: {
						output: 'static',
						adapter: undefined,
						integrations: [
							{
								name: 'foo',
								hooks: {},
							},
							{
								name: 'bar',
								hooks: {},
							},
						],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async () => {
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				const debugInfo = await debugInfoProvider.get();

				assert.deepStrictEqual(debugInfo, [
					['Astro', 'v5.5.5'],
					['Node', 'v10.1.7'],
					['System', 'win32'],
					['Package Manager', 'pnpm'],
					['Output', 'static'],
					['Adapter', 'none'],
					['Integrations', ['foo', 'bar']],
				]);
			});

			it('never retrieves versions', async () => {
				const astroVersionProvider = new FakeAstroVersionProvider('5.5.5');
				const operatingSystemProvider = new FakeOperatingSystemProvider('win32');
				const nodeVersionProvider = new FakeNodeVersionProvider('v10.1.7');

				let called = false;

				const debugInfoProvider = new DevDebugInfoProvider({
					config: {
						output: 'static',
						adapter: {
							name: '@astrojs/node',
							hooks: {},
						},
						integrations: [
							{
								name: 'foo',
								hooks: {},
							},
							{
								name: 'bar',
								hooks: {},
							},
						],
					},
					astroVersionProvider,
					operatingSystemProvider,
					packageManager: {
						name: 'pnpm',
						getPackageVersion: async () => {
							called = true;
							return undefined;
						},
					},
					nodeVersionProvider,
				});
				await debugInfoProvider.get();

				assert.equal(called, false);
			});
		});

		it('ProcessPackageManagerUserAgentProvider', () => {
			assert.equal(
				new ProcessPackageManagerUserAgentProvider().userAgent,
				process.env.npm_config_user_agent ?? null,
			);
		});

		it('ProcessNodeVersionProvider', () => {
			assert.equal(new ProcessNodeVersionProvider().version, process.version);
		});
	});
});
