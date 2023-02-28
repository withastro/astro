import { expect } from 'chai';
import { cli, parseCliDevStart, cliServerLogSetup, loadFixture } from './test-utils.js';
import stripAnsi from 'strip-ansi';
import { promises as fs, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isIPv4 } from 'node:net';
import { join } from 'node:path';
import { Writable } from 'node:stream';

export function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('astro cli', () => {
	const cliServerLogSetupWithFixture = (flags, cmd) => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		return cliServerLogSetup(['--root', fileURLToPath(projectRootURL), ...flags], cmd);
	};

	it('astro', async () => {
		const proc = await cli();
		expect(proc.exitCode).to.equal(0);
	});

	it('astro check --watch reports errors on modified files', async () => {
		let messageResolve;
		const messagePromise = new Promise((resolve) => {
			messageResolve = resolve;
		});
		const oneErrorContent = 'foobar';

		/** @type {import('./test-utils').Fixture} */
		const fixture = await loadFixture({
			root: './fixtures/astro-check-watch/',
		});
		const logs = [];
		const { watch, stop } = await fixture.check({
			flags: { watch: true },
			logging: {
				level: 'info',
				dest: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push({ ...event, message: stripAnsi(event.message) });
						if (event.message.includes('1 error')) {
							messageResolve(logs);
						}
						callback();
					},
				}),
			},
		});
		await watch();
		const pagePath = join(fileURLToPath(fixture.config.root), 'src/pages/index.astro');
		const pageContent = readFileSync(pagePath, 'utf-8');
		await fs.writeFile(pagePath, oneErrorContent);
		const messages = await messagePromise;
		await fs.writeFile(pagePath, pageContent);
		await stop();
		const diagnostics = messages.filter(
			(m) => m.type === 'diagnostics' && m.message.includes('Result')
		);
		expect(diagnostics[0].message).to.include('0 errors');
		expect(diagnostics[1].message).to.include('1 error');
	}).timeout(35000);

	it('astro --version', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const proc = await cli('--version');

		expect(proc.stdout).to.include(pkgVersion);
	});

	it('astro check no errors', async () => {
		let proc = undefined;
		const projectRootURL = new URL('./fixtures/astro-check-no-errors/', import.meta.url);
		try {
			proc = await cli('check', '--root', fileURLToPath(projectRootURL));
		} catch (err) {}

		expect(proc?.stdout).to.include('0 errors');
	}).timeout(35000);

	it('astro check has errors', async () => {
		let stdout = undefined;
		const projectRootURL = new URL('./fixtures/astro-check-errors/', import.meta.url);

		// When `astro check` finds errors, it returns an error code. As such, we need to wrap this
		// in a try/catch because otherwise Mocha will always report this test as a fail
		try {
			await cli('check', '--root', fileURLToPath(projectRootURL));
		} catch (err) {
			stdout = err.toString();
		}

		expect(stdout).to.include('1 error');
	}).timeout(35000);

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
				const { local, network } = await cliServerLogSetupWithFixture(
					flagValue ? [flag, flagValue] : [flag],
					cmd
				);

				expect(local).to.not.be.undefined;
				expect(network).to.not.be.undefined;

				const localURL = new URL(local);
				const networkURL = new URL(network);

				expect(localURL.hostname).to.be.oneOf(
					['localhost', '127.0.0.1'],
					`Expected local URL to be on localhost`
				);

				// Note: our tests run in parallel so this could be 3000+!
				expect(Number.parseInt(localURL.port)).to.be.greaterThanOrEqual(
					3000,
					`Expected Port to be >= 3000`
				);
				expect(networkURL.port).to.be.equal(
					localURL.port,
					`Expected local and network ports to be equal`
				);
				expect(isIPv4(networkURL.hostname)).to.be.equal(
					true,
					`Expected network URL to respect --host flag`
				);
			});
		});

		const hostToExposeFlags = [['', '']];
		hostToExposeFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue} - host to expose`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture([flag, flagValue], cmd);

				expect(local).to.not.be.undefined;
				expect(network).to.not.be.undefined;
				const localURL = new URL(local);

				expect(localURL.hostname).to.be.oneOf(
					['localhost', '127.0.0.1'],
					`Expected local URL to be on localhost`
				);

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
				expect(localURL.hostname).to.be.oneOf(
					['localhost', '127.0.0.1'],
					`Expected local URL to be on localhost`
				);
			});
		});
	});
});

describe('astro cli i18n', () => {
	const LOCALES = ['en_US', 'sv_SE', 'es_419.UTF-8', 'es_ES@euro', 'C'];
	LOCALES.forEach((locale) => {
		it(`astro does NOT throw on "${locale}" locales`, async () => {
			const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
			let error = null;
			try {
				const proc = cli('dev', '--root', fileURLToPath(projectRootURL), { env: { LANG: locale } });
				await parseCliDevStart(proc);
			} catch (e) {
				console.log(e);
				error = e.message;
			}
			expect(error).to.be.null;
		});
	});
});
