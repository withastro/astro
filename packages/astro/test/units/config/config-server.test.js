import { expect } from 'chai';
import { fileURLToPath } from 'url';
import { defaultLogging } from '../test-utils.js';
import { openConfig } from '../../../dist/core/config/index.js';

const cwd = fileURLToPath(new URL('../../fixtures/config-host/', import.meta.url));

describe('config.server', () => {
	function openConfigWithFlags(flags) {
		return openConfig({
			cwd: flags.root || cwd,
			flags,
			cmd: 'dev',
			logging: defaultLogging,
		});
	}

	describe('host', () => {
		it('can be specified via --host flag', async () => {
			const projectRootURL = new URL('../../fixtures/astro-basic/', import.meta.url);
			const { astroConfig } = await openConfigWithFlags({
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
				const { astroConfig } = await openConfigWithFlags({
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
				const { astroConfig } = await openConfigWithFlags({
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
					await openConfigWithFlags({
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
