import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { flagsToAstroInlineConfig, type Flags } from '../../../dist/cli/flags.js';
import { resolveConfig } from '../../../dist/core/config/index.js';

describe('config.server', () => {
	function resolveConfigWithFlags(flags: Partial<Flags>) {
		return resolveConfig(flagsToAstroInlineConfig(flags as Flags), 'dev');
	}

	describe('host', () => {
		it('can be specified via --host flag', async () => {
			const projectRootURL = new URL('../../fixtures/astro-basic/', import.meta.url);
			const { astroConfig } = await resolveConfigWithFlags({
				root: fileURLToPath(projectRootURL),
				host: true,
			});

			assert.equal(astroConfig.server.host, true);
		});
	});

	describe('config', () => {
		describe('relative path', () => {
			it('can be passed via relative --config', async () => {
				const projectRootURL = new URL('../../fixtures/astro-basic/', import.meta.url);
				const configFileURL = 'my-config.mjs';
				const { astroConfig } = await resolveConfigWithFlags({
					root: fileURLToPath(projectRootURL),
					config: configFileURL,
				});
				assert.equal(astroConfig.server.port, 8080);
			});
		});

		describe('relative path with leading ./', () => {
			it('can be passed via relative --config', async () => {
				const projectRootURL = new URL('../../fixtures/astro-basic/', import.meta.url);
				const configFileURL = './my-config.mjs';
				const { astroConfig } = await resolveConfigWithFlags({
					root: fileURLToPath(projectRootURL),
					config: configFileURL,
				});
				assert.equal(astroConfig.server.port, 8080);
			});
		});

		describe('incorrect path', () => {
			it('fails and exits when config does not exist', async () => {
				const projectRootURL = new URL('../../fixtures/astro-basic/', import.meta.url);
				const configFileURL = './does-not-exist.mjs';
				try {
					await resolveConfigWithFlags({
						root: fileURLToPath(projectRootURL),
						config: configFileURL,
					});
					assert.equal(false, true, 'this should not have resolved');
				} catch (err: unknown) {
					assert.equal((err as Error).message.includes('Unable to resolve'), true);
				}
			});
		});
	});
});
