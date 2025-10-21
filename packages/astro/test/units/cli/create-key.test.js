// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKeyCommand } from '../../../dist/cli/create-key/core/create-key.js';
import { createBuildTimeAstroVersionProvider } from '../../../dist/cli/create-key/infra/build-time-astro-version-provider.js';
import { createCliCommandRunner } from '../../../dist/cli/create-key/infra/cli-command-runner.js';
import { createLoggerHelpDisplay } from '../../../dist/cli/create-key/infra/logger-help-display.js';
import packageJson from '../../../package.json' with { type: 'json' };
import { createSpyLogger } from '../test-utils.js';
import {
	createFakeAstroVersionProvider,
	createFakeKeyGenerator,
	createPassthroughCommandRunner,
	createPassthroughTextStyler,
	createSpyHelpDisplay,
} from './utils.js';

describe('CLI create-key', () => {
	describe('core', () => {
		describe('createKey()', () => {
			it('logs the generated key', async () => {
				const { logger, logs } = createSpyLogger();
				const runner = createPassthroughCommandRunner();
				const keyGenerator = createFakeKeyGenerator('FOO');

				await runner.run(createKeyCommand, { logger, keyGenerator });

				assert.equal(logs[0].type, 'info');
				assert.equal(logs[0].label, 'crypto');
				assert.match(logs[0].message, /ASTRO_KEY=FOO/);
			});
		});
	});

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
