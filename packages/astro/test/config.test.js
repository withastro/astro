import { expect } from 'chai';
import { loadFixture, cliServerLogSetup } from './test-utils.js';
import { fileURLToPath } from 'url';
import { isIPv4 } from 'net';

describe('config', () => {
	let hostFixture;
	let portFixture;

	before(async () => {
		[hostFixture, portFixture] = await Promise.all([
			loadFixture({
				root: './fixtures/config-host/',
				server: {
					host: true,
				},
			}),
			loadFixture({
				root: './fixtures/config-host/',
				server: {
					port: 5006,
				},
			}),
		]);
	});

	describe('host', () => {
		it('can be specified in astro.config.mjs', async () => {
			expect(hostFixture.config.server.host).to.equal(true);
		});

		it('can be specified via --host flag', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const { network } = await cliServerLogSetup([
				'--root',
				fileURLToPath(projectRootURL),
				'--host',
			]);

			const networkURL = new URL(network);
			expect(isIPv4(networkURL.hostname)).to.be.equal(
				true,
				`Expected network URL to respect --host flag`
			);
		});
	});

	describe('path', () => {
		it('can be passed via --config', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const configFileURL = new URL('./fixtures/config-path/config/my-config.mjs', import.meta.url);
			const { network } = await cliServerLogSetup([
				'--root',
				fileURLToPath(projectRootURL),
				'--config',
				configFileURL.pathname,
			]);

			const networkURL = new URL(network);
			expect(isIPv4(networkURL.hostname)).to.be.equal(
				true,
				`Expected network URL to respect --host flag`
			);
		});
	});

	describe('relative path', () => {
		it('can be passed via relative --config', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const configFileURL = 'my-config.mjs';
			const { local } = await cliServerLogSetup([
				'--root',
				fileURLToPath(projectRootURL),
				'--config',
				configFileURL,
			]);

			const localURL = new URL(local);
			expect(localURL.port).to.equal('8080');
		});
	})

	describe('relative path with leading ./', () => {
		it('can be passed via relative --config', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const configFileURL = './my-config.mjs';
			const { local } = await cliServerLogSetup([
				'--root',
				fileURLToPath(projectRootURL),
				'--config',
				configFileURL,
			]);

			const localURL = new URL(local);
			expect(localURL.port).to.equal('8080');
		});
	})

	describe('incorrect path', () => {
		it('fails and exits when config does not exist', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const configFileURL = './does-not-exist.mjs';
			let exit = 0;
			try {
				await cliServerLogSetup([
					'--root',
					fileURLToPath(projectRootURL),
					'--config',
					configFileURL,
				]);
			} catch (e) {
				if (e.message.includes('Unable to resolve --config')) {
					exit = 1;
				}
			}
			
			expect(exit).to.equal(1, "Throws helpful error message when --config does not exist");
		});
	})

	describe('port', () => {
		it('can be specified in astro.config.mjs', async () => {
			expect(portFixture.config.server.port).to.deep.equal(5006);
		});
	});
});
