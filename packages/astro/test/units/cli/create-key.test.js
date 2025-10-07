// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKey } from '../../../dist/cli/create-key/core/create-key.js';
import { createBuildTimeAstroVersionProvider } from '../../../dist/cli/create-key/infra/build-time-astro-version-provider.js';
import { createLoggerHelpDisplay } from '../../../dist/cli/create-key/infra/logger-help-display.js';
import packageJson from '../../../package.json' with { type: 'json' };
import { createSpyLogger } from '../test-utils.js';

describe('CLI create-key', () => {
	describe('core', () => {
		describe('createKey()', () => {
			it('logs the generated key', async () => {
				const { logger, logs } = createSpyLogger();
				/** @type {Array<import('../../../dist/cli/create-key/domain/help-payload.js').HelpPayload>} */
				const payloads = [];

				await createKey({
					logger,
					keyGenerator: {
						generate: async () => 'FOO',
					},
					helpDisplay: {
						shouldFire: () => false,
						show: (payload) => {
							payloads.push(payload);
						},
					},
				});

				assert.deepStrictEqual(logs, [
					{
						type: 'info',
						label: 'crypto',
						message:
							'Generated a key to encrypt props passed to Server islands. To reuse the same key across builds, set this value as ASTRO_KEY in an environment variable on your build server.\n\nASTRO_KEY=FOO',
					},
				]);
				assert.deepStrictEqual(payloads, []);
			});

			it('logs the help', async () => {
				const { logger, logs } = createSpyLogger();
				/** @type {Array<import('../../../dist/cli/create-key/domain/help-payload.js').HelpPayload>} */
				const payloads = [];

				await createKey({
					logger,
					keyGenerator: {
						generate: async () => 'FOO',
					},
					helpDisplay: {
						shouldFire: () => true,
						show: (payload) => {
							payloads.push(payload);
						},
					},
				});

				assert.deepStrictEqual(logs, []);
				assert.deepStrictEqual(payloads, [
					{
						commandName: 'astro create-key',
						tables: {
							Flags: [['--help (-h)', 'See all available flags.']],
						},
						description: 'Generates a key to encrypt props passed to Server islands.',
					},
				]);
			});
		});
	});

	describe('infra', () => {
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
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider: {
							getVersion: () => '1.0.0',
						},
						flags: {
							_: [],
						},
						textStyler: {
							bgWhite: (msg) => msg,
							black: (msg) => msg,
							dim: (msg) => msg,
							green: (msg) => msg,
							bold: (msg) => msg,
							bgGreen: (msg) => msg,
						},
					});

					assert.equal(helpDisplay.shouldFire(), false);
					assert.deepStrictEqual(logs, []);
				});

				it('returns true if help flag is enabled', () => {
					const { logger, logs } = createSpyLogger();
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider: {
							getVersion: () => '1.0.0',
						},
						flags: {
							_: [],
							help: true,
						},
						textStyler: {
							bgWhite: (msg) => msg,
							black: (msg) => msg,
							dim: (msg) => msg,
							green: (msg) => msg,
							bold: (msg) => msg,
							bgGreen: (msg) => msg,
						},
					});

					assert.equal(helpDisplay.shouldFire(), true);
					assert.deepStrictEqual(logs, []);
				});

				it('returns true if h flag is enabled', () => {
					const { logger, logs } = createSpyLogger();
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider: {
							getVersion: () => '1.0.0',
						},
						flags: {
							_: [],
							h: true,
						},
						textStyler: {
							bgWhite: (msg) => msg,
							black: (msg) => msg,
							dim: (msg) => msg,
							green: (msg) => msg,
							bold: (msg) => msg,
							bgGreen: (msg) => msg,
						},
					});

					assert.equal(helpDisplay.shouldFire(), true);
					assert.deepStrictEqual(logs, []);
				});
			});

			describe('show()', () => {
				it('works', () => {
					const { logger, logs } = createSpyLogger();
					const helpDisplay = createLoggerHelpDisplay({
						logger,
						astroVersionProvider: {
							getVersion: () => '1.0.0',
						},
						flags: {
							_: [],
						},
						textStyler: {
							bgWhite: (msg) => msg,
							black: (msg) => msg,
							dim: (msg) => msg,
							green: (msg) => msg,
							bold: (msg) => msg,
							bgGreen: (msg) => msg,
						},
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
							message:
								`
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
