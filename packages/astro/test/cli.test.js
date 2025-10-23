import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs, readFileSync } from 'node:fs';
import { isIPv4 } from 'node:net';
import { join } from 'node:path';
import { platform } from 'node:process';
import { Writable } from 'node:stream';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { readFromClipboard } from '../dist/cli/info/index.js';
import { cli, cliServerLogSetup, loadFixture, parseCliDevStart } from './test-utils.js';

describe('astro cli', () => {
	const cliServerLogSetupWithFixture = (flags, cmd) => {
		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		return cliServerLogSetup(['--root', fileURLToPath(projectRootURL), ...flags], cmd);
	};

	it('astro', async () => {
		const proc = await cli();
		assert.equal(proc.exitCode, 0);
	});

	// Flaky test, in CI it exceeds the timeout most of the times
	it.skip(
		'astro check --watch reports errors on modified files',
		{
			timeout: 35000,
		},
		async () => {
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

			const checkServer = await fixture.check({
				flags: { watch: true },
				logging: {
					level: 'info',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push({ ...event, message: stripVTControlCharacters(event.message) });
							if (event.message.includes('1 error')) {
								messageResolve(logs);
							}
							callback();
						},
					}),
				},
			});
			await checkServer.watch();
			const pagePath = join(fileURLToPath(fixture.config.root), 'src/pages/index.astro');
			const pageContent = readFileSync(pagePath, 'utf-8');
			await fs.writeFile(pagePath, oneErrorContent);
			const messages = await messagePromise;
			await fs.writeFile(pagePath, pageContent);
			await checkServer.stop();
			const diagnostics = messages.filter(
				(m) => m.type === 'diagnostics' && m.message.includes('Result'),
			);
			assert.equal(diagnostics[0].message.includes('0 errors'), true);
			assert.equal(diagnostics[1].message.includes('1 error'), true);
		},
	);

	it('astro --version', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const proc = await cli('--version');

		assert.equal(proc.stdout.includes(pkgVersion), true);
	});

	it('astro info has correct Astro version', async () => {
		const proc = await cli('info', '--copy');
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgJson = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data));

		const pkgVersion = pkgJson.version;

		assert.ok(proc.stdout.includes(`v${pkgVersion}`));
		assert.equal(proc.exitCode, 0);

		// On Linux we only check if we have Wayland or x11. In Codespaces it falsely reports that it does have x11
		if (
			platform === 'linux' &&
			((!process.env.WAYLAND_DISPLAY && !process.env.DISPLAY) || process.env.CODESPACES)
		) {
			assert.ok(proc.stdout.includes('Please manually copy the text above'));
		} else {
			assert.ok(proc.stdout.includes('Copied to clipboard!'));
			const clipboardContent = await readFromClipboard();
			assert.ok(clipboardContent.includes(`v${pkgVersion}`));
		}
	});

	it(
		'astro info shows correct Vite and integration versions when using pnpm',
		{ skip: process.env.ECOSYSTEM_CI },
		async () => {
			const projectRootURL = new URL('./fixtures/astro-info-versions/', import.meta.url);
			const projectPackageJSONUrl = new URL('./package.json', projectRootURL);

			const packageJSON = await fs
				.readFile(fileURLToPath(projectPackageJSONUrl))
				.then((json) => JSON.parse(json));

			const viteVersion = packageJSON.dependencies.vite;
			const adapterVersion = packageJSON.dependencies['@astrojs/node'];
			const integrationVersion = packageJSON.dependencies['@astrojs/react'];

			const proc = spawnSync('pnpm', ['astro', 'info', '--copy'], {
				cwd: projectRootURL,
				encoding: 'utf-8',
				shell: true,
			});

			assert.equal(proc.stdout.includes(`v${viteVersion}`), true);
			assert.equal(proc.stdout.includes(`@astrojs/node (v${adapterVersion})`), true);
			assert.equal(proc.stdout.includes(`@astrojs/react (v${integrationVersion})`), true);
			assert.equal(proc.stdout.includes(`manual-integration`), true);
		},
	);

	it(
		'astro info shows correct Vite and integration versions when using npm',
		{ skip: process.env.ECOSYSTEM_CI },
		async () => {
			const projectRootURL = new URL('./fixtures/astro-info-versions/', import.meta.url);
			const projectPackageJSONUrl = new URL('./package.json', projectRootURL);

			const packageJSON = await fs
				.readFile(fileURLToPath(projectPackageJSONUrl))
				.then((json) => JSON.parse(json));

			const viteVersion = packageJSON.dependencies.vite;
			const adapterVersion = packageJSON.dependencies['@astrojs/node'];
			const integrationVersion = packageJSON.dependencies['@astrojs/react'];

			const proc = spawnSync('npm', ['run', 'astro', 'info', '--copy'], {
				cwd: projectRootURL,
				encoding: 'utf-8',
				shell: true,
			});

			assert.equal(proc.stdout.includes(`v${viteVersion}`), true);
			assert.equal(proc.stdout.includes(`@astrojs/node (v${adapterVersion})`), true);
			assert.equal(proc.stdout.includes(`@astrojs/react (v${integrationVersion})`), true);
			assert.equal(proc.stdout.includes(`manual-integration`), true);
		},
	);

	it(
		'astro info shows correct Vite and integration versions when using yarn',
		{ skip: true },
		async () => {
			const fixtureRootURL = new URL('./fixtures/astro-info-versions/', import.meta.url);
			const testsRootURL = new URL('../', import.meta.url);
			const astroPackageJSONUrl = new URL('./package.json', testsRootURL);
			const packageJSONUrl = new URL('./package.json', fixtureRootURL);
			const yarnLockUrl = new URL('./yarn.lock', fixtureRootURL);

			const astroVersion = await fs
				.readFile(fileURLToPath(astroPackageJSONUrl))
				.then((text) => JSON.parse(text).version);
			const packFileName = `./astro-${astroVersion}.tgz`;
			const packURL = new URL(packFileName, testsRootURL);
			const packDestinationURL = new URL(packFileName, fixtureRootURL);

			// Add a packageManager field to the fixture's package.json file, otherwise
			// corepack won't allow us to use yarn because a parent directory has a different
			// package.json file with a packageManager field
			let packageJSON = await fs
				.readFile(fileURLToPath(packageJSONUrl), { encoding: 'utf-8' })
				.then((text) => JSON.parse(text));
			packageJSON.packageManager = 'yarn@4.9.4';

			const viteVersion = packageJSON.dependencies.vite;
			const adapterVersion = packageJSON.dependencies['@astrojs/node'];
			const integrationVersion = packageJSON.dependencies['@astrojs/react'];

			await fs.writeFile(fileURLToPath(packageJSONUrl), JSON.stringify(packageJSON), {
				encoding: 'utf-8',
			});
			await fs.writeFile(yarnLockUrl, '', { encoding: 'utf-8' });

			spawnSync('pnpm', ['pack'], { cwd: testsRootURL, encoding: 'utf-8', shell: true });
			await fs.rename(packURL, packDestinationURL);

			spawnSync('corepack', ['use', 'yarn@4.9.4'], {
				cwd: fixtureRootURL,
				encoding: 'utf-8',
				shell: true,
			});

			spawnSync('corepack', ['yarn', 'add', packFileName], {
				cwd: fixtureRootURL,
				encoding: 'utf-8',
				shell: true,
			});

			const proc = spawnSync('corepack', ['yarn', 'astro', 'info', '--copy'], {
				cwd: fixtureRootURL,
				encoding: 'utf-8',
				shell: true,
			});

			// Reset changes to package.json
			delete packageJSON.packageManager;
			packageJSON.dependencies.astro = 'workspace:*';

			await fs.writeFile(packageJSONUrl, JSON.stringify(packageJSON, null, 2), {
				encoding: 'utf-8',
			});
			await fs.rm(yarnLockUrl, { force: true });
			await fs.rm(packDestinationURL, { force: true });

			spawnSync('pnpm', ['install'], { cwd: fixtureRootURL, shell: true });

			assert.equal(proc.stdout.includes(`v${viteVersion}`), true);
			assert.equal(proc.stdout.includes(`@astrojs/node (v${adapterVersion})`), true);
			assert.equal(proc.stdout.includes(`@astrojs/react (v${integrationVersion})`), true);
			assert.equal(proc.stdout.includes(`manual-integration`), true);
		},
	);

	it(
		'astro check no errors',
		{
			timeout: 35000,
		},
		async () => {
			let proc = undefined;
			const projectRootURL = new URL('./fixtures/astro-check-no-errors/', import.meta.url);
			try {
				proc = await cli('check', '--root', fileURLToPath(projectRootURL));
			} catch {}

			assert.equal(proc?.stdout.includes('0 errors'), true);
		},
	);

	it(
		'astro check has errors',
		{
			timeout: 35000,
		},
		async () => {
			let stdout = undefined;
			const projectRootURL = new URL('./fixtures/astro-check-errors/', import.meta.url);

			// When `astro check` finds errors, it returns an error code. As such, we need to wrap this
			// in a try/catch because otherwise Mocha will always report this test as a fail
			try {
				await cli('check', '--root', fileURLToPath(projectRootURL));
			} catch (err) {
				stdout = err.toString();
			}

			assert.equal(stdout.includes('1 error'), true);
		},
	);

	it('astro dev welcome', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const projectRootURL = new URL('./fixtures/astro-basic/', import.meta.url);
		const proc = cli('dev', '--root', fileURLToPath(projectRootURL));
		const { messages } = await parseCliDevStart(proc);

		const message = messages.join('\n');

		assert.equal(message.includes('astro'), true);
		assert.equal(message.includes(pkgVersion), true);
		assert.equal(message.includes('ready in'), true);
	});

	['dev', 'preview'].forEach((cmd) => {
		const networkLogFlags = [['--host'], ['--host', '0.0.0.0']];
		networkLogFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue ?? ''} - network log`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture(
					flagValue ? [flag, flagValue] : [flag],
					cmd,
				);

				assert.notEqual(local, undefined);
				assert.notEqual(network, undefined);

				const localURL = new URL(local);
				const networkURL = new URL(network);

				assert.equal(['localhost', '127.0.0.1'].includes(localURL.hostname), true),
					`Expected local URL to be on localhost`;

				// Note: our tests run in parallel so this could be 3000+!
				assert.equal(Number.parseInt(localURL.port) >= 4321, true, `Expected Port to be >= 4321`);
				assert.equal(
					networkURL.port,
					localURL.port,
					`Expected local and network ports to be equal`,
				);
				assert.equal(
					isIPv4(networkURL.hostname),
					true,
					`Expected network URL to respect --host flag`,
				);
			});
		});

		const hostToExposeFlags = [['', '']];
		hostToExposeFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue} - host to expose`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture([flag, flagValue], cmd);

				assert.notEqual(local, undefined);
				assert.notEqual(network, undefined);
				const localURL = new URL(local);

				assert.equal(
					['localhost', '127.0.0.1'].includes(localURL.hostname),
					true,
					`Expected local URL to be on localhost`,
				);

				assert.throws(() => new URL(networkURL));
			});
		});

		const noNetworkLogFlags = [
			['--host', 'localhost'],
			['--host', '127.0.0.1'],
		];
		noNetworkLogFlags.forEach(([flag, flagValue]) => {
			it(`astro ${cmd} ${flag} ${flagValue} - no network log`, async () => {
				const { local, network } = await cliServerLogSetupWithFixture([flag, flagValue], cmd);

				assert.notEqual(local, undefined);
				assert.equal(network, undefined);

				const localURL = new URL(local);
				assert.equal(
					['localhost', '127.0.0.1'].includes(localURL.hostname),
					true,
					`Expected local URL to be on localhost`,
				);
			});
		});
	});
});
