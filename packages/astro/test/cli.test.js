import { expect } from 'chai';
import { cli, parseCliDevStart } from './test-utils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

describe('astro cli', () => {
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

	const hostnames = [undefined, '0.0.0.0', '127.0.0.1'];

	hostnames.forEach((hostname) => {
		const hostnameArgs = hostname ? ['--hostname', hostname] : [];
		it(`astro dev ${hostnameArgs.join(' ') || '(no --hostname)'}`, async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			const proc = cli('dev', '--project-root', fileURLToPath(projectRootURL), ...hostnameArgs);

			const { messages } = await parseCliDevStart(proc);

			const local = messages[1].replace(/Local\s*/g, '');
			const network = messages[2].replace(/Network\s*/g, '');

			expect(local).to.not.be.undefined;
			expect(network).to.not.be.undefined;
			const localURL = new URL(local);
			const networkURL = new URL(network);

			expect(localURL.hostname).to.be.equal('localhost', `Expected local URL to be on localhost`);
			// Note: our tests run in parallel so this could be 3000+!
			expect(Number.parseInt(localURL.port)).to.be.greaterThanOrEqual(3000, `Expected Port to be >= 3000`);
			expect(networkURL.hostname).to.be.equal(hostname ?? '127.0.0.1', `Expected Network URL to use passed hostname`);
		});
	});

	it('astro build', async () => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);

		const proc = await cli('build', '--project-root', fileURLToPath(projectRootURL));

		expect(proc.stdout).to.include('Done');
	});
});
