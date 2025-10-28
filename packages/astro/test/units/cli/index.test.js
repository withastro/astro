// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBuildTimeAstroVersionProvider } from '../../../dist/cli/infra/build-time-astro-version-provider.js';
import { createCliCommandRunner } from '../../../dist/cli/infra/cli-command-runner.js';
import { createLoggerHelpDisplay } from '../../../dist/cli/infra/logger-help-display.js';
import packageJson from '../../../package.json' with { type: 'json' };
import { createSpyLogger } from '../test-utils.js';
import {
	createFakeAstroVersionProvider,
	createPassthroughTextStyler,
	createSpyHelpDisplay,
} from './utils.js';

describe('CLI shared', () => {
	describe('infra', () => {
		describe('createCliCommandRunner()', () => {
			it('logs the help if it should fire', () => {
				const { payloads, helpDisplay } = createSpyHelpDisplay(true);
				const runner = createCliCommandRunner({ helpDisplay });
				let ran = false;

				runner.run({
					help: {
						commandName: 'foo',
					},
					run: () => {
						ran = true;
					},
				});

				assert.equal(payloads.length, 1);
				assert.equal(ran, false);
			});

			it('does not log the help if it should not should fire', () => {
				const { payloads, helpDisplay } = createSpyHelpDisplay(false);
				const runner = createCliCommandRunner({ helpDisplay });
				let ran = false;

				runner.run({
					help: {
						commandName: 'foo',
					},
					run: () => {
						ran = true;
					},
				});

				assert.equal(payloads.length, 0);
				assert.equal(ran, true);
			});
		});

		describe('createBuildTimeAstroVersionProvider()', () => {
			it('returns the value from the build', () => {
				const astroVersionProvider = createBuildTimeAstroVersionProvider();

				assert.equal(astroVersionProvider.getVersion(), packageJson.version);
			});
		});

		describe('createLoggerHelpDisplay()', () => {
			describe('shouldFire()', () => {
				it('returns false if no relevant flag is enabled', () => {
					const { logger, logs } = createSpyLogger();
					const textStyler = createPassthroughTextStyler();
					const astroVersionProvider = createFakeAstroVersionProvider('1.0.0');
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
						},
						textStyler,
					});

					assert.equal(helpDisplay.shouldFire(), false);
					assert.deepStrictEqual(logs, []);
				});

				it('returns true if help flag is enabled', () => {
					const { logger, logs } = createSpyLogger();
					const textStyler = createPassthroughTextStyler();
					const astroVersionProvider = createFakeAstroVersionProvider('1.0.0');
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
							help: true,
						},
						textStyler,
					});

					assert.equal(helpDisplay.shouldFire(), true);
					assert.deepStrictEqual(logs, []);
				});

				it('returns true if h flag is enabled', () => {
					const { logger, logs } = createSpyLogger();
					const textStyler = createPassthroughTextStyler();
					const astroVersionProvider = createFakeAstroVersionProvider('1.0.0');
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider,
						flags: {
							_: [],
							h: true,
						},
						textStyler,
					});

					assert.equal(helpDisplay.shouldFire(), true);
					assert.deepStrictEqual(logs, []);
				});
			});

			describe('show()', () => {
				it('works', () => {
					const { logger, logs } = createSpyLogger();
					const textStyler = createPassthroughTextStyler();
					const astroVersionProvider = createFakeAstroVersionProvider('1.0.0');
					const helpDisplay = createLoggerHelpDisplay({
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

					assert.deepStrictEqual(logs, [
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
	});
});
