import { expect } from 'chai';
import { cli, parseCliDevStart, cliServerLogSetup } from './test-utils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { isIPv4 } from 'net';

describe('astro cli', () => {
	const cliServerLogSetupWithFixture = (flags, cmd) => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		return cliServerLogSetup(['--root', fileURLToPath(projectRootURL), ...flags], cmd);
	};

	it('astro', async () => {
		const proc = await cli();

		expect(proc.stdout).to.include('Futuristic web development tool');
	});

	it('astro --version', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const proc = await cli('--version');

		expect(proc.stdout).to.include(pkgVersion);
	});

	it('astro build', async () => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		const proc = await cli('build', '--root', fileURLToPath(projectRootURL));
		expect(proc.stdout).to.include('Complete');
	});

	it('astro dev welcome', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		const proc = cli('dev', '--root', fileURLToPath(projectRootURL));
		const { messages } = await parseCliDevStart(proc);

		expect(messages[0]).to.contain('astro');
		expect(messages[0]).to.contain(pkgVersion);
		expect(messages[0]).to.contain('started in');
	});

	['dev', 'preview'].forEach((cmd) => {
		const networkLogFlags = [['--host'], ['--host', '0.0.0.0']];
		networkLogFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue ?? ''} - network log`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture(flagValue ? [flag, flagValue] : [flag], cmd);

				expect(local).to.not.be.undefined;
				expect(network).to.not.be.undefined;

				const localURL = new URL(local);
				const networkURL = new URL(network);

				expect(localURL.hostname).to.be.equal(flagValue ?? 'localhost', `Expected local URL to be on localhost`);
				// Note: our tests run in parallel so this could be 3000+!
				expect(Number.parseInt(localURL.port)).to.be.greaterThanOrEqual(3000, `Expected Port to be >= 3000`);
				expect(networkURL.port).to.be.equal(localURL.port, `Expected local and network ports to be equal`);
				expect(isIPv4(networkURL.hostname)).to.be.equal(true, `Expected network URL to respect --host flag`);
			});
		});

		const hostToExposeFlags = [['', '']];
		hostToExposeFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue} - host to expose`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture([flag, flagValue], cmd);

				expect(local).to.not.be.undefined;
				expect(network).to.not.be.undefined;
				const localURL = new URL(local);

				expect(localURL.hostname).to.be.equal('localhost', `Expected local URL to be on localhost`);
				expect(() => new URL(networkURL)).to.throw();
			});
		});

		const noNetworkLogFlags = [
			['--host', 'localhost'],
			['--host', '127.0.0.1'],
		];
		noNetworkLogFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue} - no network log`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture([flag, flagValue], cmd);

				expect(local).to.not.be.undefined;
				expect(network).to.be.undefined;

				const localURL = new URL(local);
				expect(localURL.hostname).to.be.equal(flagValue, `Expected local URL to be on localhost`);
			});
		});
	});
});
