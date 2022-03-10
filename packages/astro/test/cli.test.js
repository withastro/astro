import { expect } from 'chai';
import { cli, parseCliDevStart, cliServerLogSetup } from './test-utils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { isIPv4 } from 'net';

describe('astro cli', () => {
	const cliServerLogSetupWithFixture = (flags, cmd) => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		return cliServerLogSetup(['--project-root', fileURLToPath(projectRootURL), ...flags], cmd);
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

	it('astro dev welcome', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		const proc = cli('dev', '--project-root', fileURLToPath(projectRootURL));
		const { messages } = await parseCliDevStart(proc);

		expect(messages[0]).to.contain('astro');
		expect(messages[0]).to.contain(pkgVersion);
		expect(messages[0]).to.contain('started in');
	});

	['dev', 'preview'].forEach((cmd) => {
		it(`astro ${cmd} (no --host)`, async () => {
			const { local, network } = await cliServerLogSetupWithFixture([], cmd);

			expect(local).to.not.be.undefined;
			expect(network).to.not.be.undefined;

			const localURL = new URL(local);
			expect(localURL.hostname).to.be.equal('localhost', `Expected local URL to be on localhost`);
			// should not print a network URL when --host is missing!
			expect(() => new URL(network)).to.throw();
		});
	});

	const hostnameFlags = [
		['--hostname', '0.0.0.0'],
		['--hostname', '127.0.0.1'],
	];

	// TODO: remove once --hostname is baselined
	hostnameFlags.forEach((flags) => {
		['dev', 'preview'].forEach((cmd) => {
			it(`astro ${cmd} ${flags.join(' ')}`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture(flags, cmd);

				expect(local).to.not.be.undefined;
				expect(network).to.not.be.undefined;
				const localURL = new URL(local);
				const networkURL = new URL(network);

				expect(localURL.hostname).to.be.equal('localhost', `Expected local URL to be on localhost`);
				// Note: our tests run in parallel so this could be 3000+!
				expect(Number.parseInt(localURL.port)).to.be.greaterThanOrEqual(3000, `Expected Port to be >= 3000`);
				expect(isIPv4(networkURL.hostname)).to.be.equal(true, `Expected network URL to respect --hostname flag`);
			});
		});
	});

	const hostFlags = [['--host'], ['--host', '0.0.0.0'], ['--host', '127.0.0.1']];

	hostFlags.forEach((flags) => {
		['dev', 'preview'].forEach((cmd) => {
			it(`astro ${cmd} ${flags.join(' ')}`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture(flags);

				expect(local).to.not.be.undefined;
				expect(network).to.not.be.undefined;

				const localURL = new URL(local);
				const networkURL = new URL(network);

				expect(localURL.hostname).to.be.equal('localhost', `Expected local URL to be on localhost`);
				// Note: our tests run in parallel so this could be 3000+!
				expect(Number.parseInt(localURL.port)).to.be.greaterThanOrEqual(3000, `Expected Port to be >= 3000`);
				expect(networkURL.port).to.be.equal(localURL.port, `Expected local and network ports to be equal`);
				expect(isIPv4(networkURL.hostname)).to.be.equal(true, `Expected network URL to respect --host flag`);
			});
		});
	});

	it('astro build', async () => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);

		const proc = await cli('build', '--project-root', fileURLToPath(projectRootURL));

		expect(proc.stdout).to.include('Done');
	});
});
