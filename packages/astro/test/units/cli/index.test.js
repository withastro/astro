// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BuildTimeAstroVersionProvider } from '../../../dist/cli/infra/build-time-astro-version-provider.js';
import { CliCommandRunner } from '../../../dist/cli/infra/cli-command-runner.js';
import { LoggerHelpDisplay } from '../../../dist/cli/infra/logger-help-display.js';
import { PassthroughTextStyler } from '../../../dist/cli/infra/passthrough-text-styler.js';
import { ProcessOperatingSystemProvider } from '../../../dist/cli/infra/process-operating-system-provider.js';
import packageJson from '../../../package.json' with { type: 'json' };
import { SpyLogger } from '../test-utils.js';
import { FakeAstroVersionProvider, SpyHelpDisplay } from './utils.js';

describe('CLI shared', () => {
	describe('infra', () => {
		describe('CliCommandRunner', () => {
			it('logs the help if it should fire', () => {
				const helpDisplay = new SpyHelpDisplay(true);
				const runner = new CliCommandRunner({ helpDisplay });
				let ran = false;

				runner.run({
					help: {
						commandName: 'foo',
					},
					run: () => {
						ran = true;
					},
				});

				assert.equal(helpDisplay.payloads.length, 1);
				assert.equal(ran, false);
			});

			it('does not log the help if it should not should fire', () => {
				const helpDisplay = new SpyHelpDisplay(false);
				const runner = new CliCommandRunner({ helpDisplay });
				let ran = false;

				runner.run({
					help: {
						commandName: 'foo',
					},
					run: () => {
						ran = true;
					},
				});

				assert.equal(helpDisplay.payloads.length, 0);
				assert.equal(ran, true);
			});
		});

		describe('BuildTimeAstroVersionProvider', () => {
			it('returns the value from the build', () => {
				const astroVersionProvider = new BuildTimeAstroVersionProvider();

				assert.equal(astroVersionProvider.version, packageJson.version);
			});
		});

		describe('LoggerHelpDisplay', () => {
			describe('shouldFire()', () => {
				it('returns false if no relevant flag is enabled', () => {
					const logger = new SpyLogger();
					const textStyler = new PassthroughTextStyler();
					const astroVersionProvider = new FakeAstroVersionProvider('1.0.0');
					const helpDisplay = new LoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
						},
						textStyler,
					});

					assert.equal(helpDisplay.shouldFire(), false);
					assert.deepStrictEqual(logger.logs, []);
				});

				it('returns true if help flag is enabled', () => {
					const logger = new SpyLogger();
					const textStyler = new PassthroughTextStyler();
					const astroVersionProvider = new FakeAstroVersionProvider('1.0.0');
					const helpDisplay = new LoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
							help: true,
						},
						textStyler,
					});

					assert.equal(helpDisplay.shouldFire(), true);
					assert.deepStrictEqual(logger.logs, []);
				});

				it('returns true if h flag is enabled', () => {
					const logger = new SpyLogger();
					const textStyler = new PassthroughTextStyler();
					const astroVersionProvider = new FakeAstroVersionProvider('1.0.0');
					const helpDisplay = new LoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
							h: true,
						},
						textStyler,
					});

					assert.equal(helpDisplay.shouldFire(), true);
					assert.deepStrictEqual(logger.logs, []);
				});
			});

			describe('show()', () => {
				it('works', () => {
					const logger = new SpyLogger();
					const textStyler = new PassthroughTextStyler();
					const astroVersionProvider = new FakeAstroVersionProvider('1.0.0');
					const helpDisplay = new LoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
						},
						textStyler,
					});

					helpDisplay.show({
						commandName: 'astro preview',
						usage: '[...flags]',
						tables: {
							Flags: [
								['--port', `Specify which port to run on. Defaults to 4321.`],
								['--host', `Listen on all addresses, including LAN and public addresses.`],
							],
						},
						description: 'Starts a local server to serve your static dist/ directory.',
					});

					assert.deepStrictEqual(logger.logs, [
						{
							type: 'info',
							label: 'SKIP_FORMAT',
							message: `
  astro preview [...flags]

   Flags 
  --port  Specify which port to run on. Defaults to 4321.
  --host  Listen on all addresses, including LAN and public addresses.

Starts a local server to serve your static dist/ directory.
`,
						},
					]);
				});
			});
		});

		describe('ProcessOperatingSystemProvider', () => {
			it('returns the value from process.platform', () => {
				const operatingSystemProvider = new ProcessOperatingSystemProvider();

				const platform = operatingSystemProvider.name;

				assert.equal(platform, process.platform);
			});
		});
	});
});
