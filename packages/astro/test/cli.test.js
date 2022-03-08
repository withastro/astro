import { expect } from 'chai';
import { cli } from './test-utils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

describe('astro cli', () => {
	it('astro', async () => {
		const proc = await cli();

		expect(proc.stdout).to.include('astro - Futuristic web development tool');
	});

	it('astro --version', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const proc = await cli('--version');

		expect(proc.stdout).to.equal(pkgVersion);
	});

	[undefined, '0.0.0.0', '127.0.0.1'].forEach(hostname => {
		it(`astro dev --hostname=${hostname}`, async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);

			const hostnameArgs = hostname ? ['--hostname', hostname] : []
			const proc = cli('dev', '--project-root', fileURLToPath(projectRootURL), ...hostnameArgs);

			let stdout = '';

			for await (const chunk of proc.stdout) {
				stdout += chunk;

				if (chunk.includes('Local:')) break;
			}

			proc.kill();

			expect(stdout).to.include('Local:   http://localhost:3000');
			expect(stdout).to.include(`Network: http://${hostname ?? '127.0.0.1'}:3000`);
		});
	});

	it('astro build', async () => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);

		const proc = await cli('build', '--project-root', fileURLToPath(projectRootURL));

		expect(proc.stdout).to.include('Done');
	});
});
