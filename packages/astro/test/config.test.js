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

	describe('port', () => {
		it('can be specified in astro.config.mjs', async () => {
			expect(portFixture.config.server.port).to.deep.equal(5006);
		});
	});
});
