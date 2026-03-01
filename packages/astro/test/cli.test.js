import assert from 'node:assert/strict';
import { promises as fs, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { cli, loadFixture } from './test-utils.js';

describe('astro cli', () => {
	it('astro', async () => {
		const result = await cli().getResult();
		assert.equal(result.exitCode, 0);
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

		const result = await cli('--version').getResult();

		assert.equal(result.stdout.includes(pkgVersion), true);
	});

	it(
		'astro check no errors',
		{
			timeout: 35000,
		},
		async () => {
			const projectRootURL = new URL('./fixtures/astro-check-no-errors/', import.meta.url);
			const result = await cli(
				'check',
				'--root',
				fileURLToPath(projectRootURL),
				'--noSync',
			).getResult();

			assert.equal(result.stdout.includes('0 errors'), true);
		},
	);

	it(
		'astro check has errors',
		{
			timeout: 35000,
		},
		async () => {
			const projectRootURL = new URL('./fixtures/astro-check-errors/', import.meta.url);
			const result = await cli(
				'check',
				'--root',
				fileURLToPath(projectRootURL),
				'--noSync',
			).getResult();

			assert.equal(result.stdout.includes('1 error'), true);
		},
	);
});
