import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { flagsToAstroInlineConfig } from '../../../dist/cli/flags.js';
import { resolveConfig } from '../../../dist/core/config/index.js';

const cwd = fileURLToPath(new URL('../../fixtures/config-host/', import.meta.url));

describe('config.server', () => {
	function resolveConfigWithFlags(flags) {
		return resolveConfig(
			flagsToAstroInlineConfig({
				root: cwd,
				...flags,
			}),
			'dev'
		);
	}

	describe('host', () => {
		it('can be specified via --host flag', async () => {
			const projectRootURL = new URL('../../fixtures/astro-basic/', import.meta.url);
			const { astroConfig } = await resolveConfigWithFlags({
				root: fileURLToPath(projectRootURL),
				host: true,
			});

			expect(astroConfig.server.host).to.equal(true);
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
				expect(astroConfig.server.port).to.equal(8080);
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
				expect(astroConfig.server.port).to.equal(8080);
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
					expect(false).to.equal(true, 'this should not have resolved');
				} catch (err) {
					expect(err.message).to.match(/Unable to resolve/);
				}
			});
		});
	});
});
