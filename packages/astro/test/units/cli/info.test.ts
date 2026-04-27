import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPackageManager } from '../../../dist/cli/info/core/get-package-manager.js';
import { infoCommand } from '../../../dist/cli/info/core/info.js';
import { CliDebugInfoProvider } from '../../../dist/cli/info/infra/cli-debug-info-provider.js';
import { DevDebugInfoProvider } from '../../../dist/cli/info/infra/dev-debug-info-provider.js';
import { ProcessNodeVersionProvider } from '../../../dist/cli/info/infra/process-node-version-provider.js';
import { ProcessPackageManagerUserAgentProvider } from '../../../dist/cli/info/infra/process-package-manager-user-agent-provider.js';
import { TinyclipClipboard } from '../../../dist/cli/info/infra/tinyclip-clipboard.js';
import { SpyLogger } from '../test-utils.ts';
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
} from './utils.ts';

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
					getDebugInfoFormatter: ({ pretty }: { pretty: boolean }) => ({
						format: (debugInfo: Array<[string, string | Array<string>]>) =>
							`${pretty}-${JSON.stringify(debugInfo)}`,
					}),
					clipboard,
					logger,
				});

				assert.equal(logger.logs[0].level, 'info');
				assert.equal(logger.logs[0].message, 'true-[["foo","bar"]]');
			});

			it('copies raw debug info', async () => {
				const logger = new SpyLogger();
				const runner = new PassthroughCommandRunner();
				const debugInfoProvider = new FakeDebugInfoProvider([['foo', 'bar']]);
				const clipboard = new SpyClipboard();

				await runner.run(infoCommand, {
					debugInfoProvider,
					getDebugInfoFormatter: ({ pretty }: { pretty: boolean }) => ({
						format: (debugInfo: Array<[string, string | Array<string>]>) =>
							`${pretty}-${JSON.stringify(debugInfo)}`,
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
		describe('TinyclipClipboard', () => {
			it('aborts if user does not confirm', async () => {
				const logger = new SpyLogger();
				const prompt = new FakePrompt(false);

				const clipboard = new TinyclipClipboard({
					logger,
					prompt,
				});
				const text = Date.now().toString();
				await clipboard.copy(text);

				assert.equal(logger.logs.length, 0);
			});

			it('copies if user confirms', async () => {
				const logger = new SpyLogger();
				const prompt = new FakePrompt(true);

				const clipboard = new TinyclipClipboard({
					logger,
					prompt,
				});
				const text = Date.now().toString();
				await clipboard.copy(text);

				assert.equal(logger.logs.length, 1);
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
