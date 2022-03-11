import { expect } from 'chai';
import { cli, loadFixture, cliServerLogSetup } from './test-utils.js';
import { fileURLToPath } from 'url';
import { isIPv4 } from 'net';

describe('config', () => {
	let hostnameFixture;
	let hostFixture;
	let portFixture;

	before(async () => {
		[hostnameFixture, hostFixture, portFixture] = await Promise.all([
			loadFixture({ projectRoot: './fixtures/config-hostname/' }),
			loadFixture({ projectRoot: './fixtures/config-host/' }),
			loadFixture({ projectRoot: './fixtures/config-port/' }),
		]);
	});

	// TODO: remove test once --hostname is baselined
	describe('hostname', () => {
		it('can be specified in astro.config.mjs', async () => {
			expect(hostnameFixture.config.devOptions.hostname).to.equal('0.0.0.0');
		});

		it('can be specified via --hostname flag', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const { network } = await cliServerLogSetup(['--project-root', fileURLToPath(projectRootURL), '--hostname', '0.0.0.0']);

			const networkURL = new URL(network);
			expect(isIPv4(networkURL.hostname)).to.be.equal(true, `Expected network URL to respect --hostname flag`);
		});
	});

	describe('host', () => {
		it('can be specified in astro.config.mjs', async () => {
			expect(hostFixture.config.devOptions.host).to.equal(true);
		});

		it('can be specified via --host flag', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const { network } = await cliServerLogSetup(['--project-root', fileURLToPath(projectRootURL), '--host']);

			const networkURL = new URL(network);
			expect(isIPv4(networkURL.hostname)).to.be.equal(true, `Expected network URL to respect --hostname flag`);
		});
	});

	describe('path', () => {
		it('can be passed via --config', async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const configFileURL = new URL('./fixtures/config-path/config/my-config.mjs', import.meta.url);
			const { network } = await cliServerLogSetup(['--project-root', fileURLToPath(projectRootURL), '--config', configFileURL.pathname]);

			const networkURL = new URL(network);
			expect(isIPv4(networkURL.hostname)).to.be.equal(true, `Expected network URL to respect --hostname flag`);
		});
	});

	describe('port', () => {
		it('can be specified in astro.config.mjs', async () => {
			expect(portFixture.config.devOptions.port).to.deep.equal(5006);
		});
	});
});
