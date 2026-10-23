import assert from 'node:assert/strict';
import { promises as fs, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { cli, loadFixture, type Fixture } from './test-utils.ts';

describe('astro cli', () => {
	it('astro', async () => {
		const result = await cli().getResult();
		assert.equal(result.exitCode, 0);
	});

	// Flaky test, in CI it exceeds the timeout most of the times
	it.skip('astro check --watch reports errors on modified files', {
		timeout: 35000,
	}, async () => {
		type LogEntry = { type: string; message: string; [key: string]: unknown };
		let messageResolve: (value: LogEntry[]) => void;
		const messagePromise = new Promise<LogEntry[]>((resolve) => {
			messageResolve = resolve;
		});
		const oneErrorContent = 'foobar';

		const fixture: Fixture = await loadFixture({
			root: './fixtures/astro-check-watch/',
			outDir: './dist/cli/',
		});
		const logs: LogEntry[] = [];

		const checkServer: boolean | void = await fixture.check({
			_: [],
			flags: { watch: true },
			logging: {
				level: 'info',
				destination: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push({ ...event, message: stripVTControlCharacters(event.message) });
						if (event.message.includes('1 error')) {
							messageResolve!(logs);
						}
						callback();
					},
				}),
			},
		});
		// @ts-expect-error: `fixture.check()`'s return type is incorrectly typed
		await checkServer.watch();
		const pagePath = join(fileURLToPath(fixture.config.root), 'src/pages/index.astro');
		const pageContent = readFileSync(pagePath, 'utf-8');
		await fs.writeFile(pagePath, oneErrorContent);
		const messages = await messagePromise;
		await fs.writeFile(pagePath, pageContent);
		// @ts-expect-error: `fixture.check()`'s return type is incorrectly typed
		await checkServer.stop();
		const diagnostics = messages.filter(
			(m) => m.type === 'diagnostics' && m.message.includes('Result'),
		);
		assert.equal(diagnostics[0].message.includes('0 errors'), true);
		assert.equal(diagnostics[1].message.includes('1 error'), true);
	});

	it('astro --version', async () => {
		const pkgURL = new URL('../package.json', import.meta.url);
		const pkgVersion = await fs.readFile(pkgURL, 'utf8').then((data) => JSON.parse(data).version);

		const result = await cli('--version').getResult();

		assert.equal(result.stdout.includes(pkgVersion), true);
	});

	it('astro check no errors', {
		// type definitions are not generated for ecosystem CI
		skip: !!process.env.ECOSYSTEM_CI,
		timeout: 35000,
	}, async () => {
		const projectRootURL = new URL('./fixtures/astro-check-no-errors/', import.meta.url);
		const result = await cli(
			'check',
			'--root',
			fileURLToPath(projectRootURL),
			'--noSync',
		).getResult();

		assert.equal(result.stdout.includes('0 errors'), true);
	});

	it('astro check has errors', {
		// type definitions are not generated for ecosystem CI
		skip: !!process.env.ECOSYSTEM_CI,
		timeout: 35000,
	}, async () => {
		const projectRootURL = new URL('./fixtures/astro-check-errors/', import.meta.url);
		const result = await cli(
			'check',
			'--root',
			fileURLToPath(projectRootURL),
			'--noSync',
		).getResult();

		assert.equal(result.stdout.includes('1 error'), true);
	});

	it('astro check keeps structured stdout separate from sync logs', {
		skip: !!process.env.ECOSYSTEM_CI,
		timeout: 70000,
	}, async () => {
		const projectRoot = fileURLToPath(
			new URL('./fixtures/astro-check-no-errors/', import.meta.url),
		);
		for (const loggerFlags of [[], ['--json']]) {
			const result = await cli(
				'check',
				'--root',
				projectRoot,
				'--reporter=json',
				...loggerFlags,
			).getResult();
			assert.equal(result.exitCode, 0, result.stderr);
			assert.equal(JSON.parse(result.stdout).version, 1);
			assert.match(result.stderr, /Generated/);
			assert.ok(!result.stdout.includes('Getting diagnostics'));
			if (loggerFlags.length > 0) {
				const logs = result.stderr
					.trim()
					.split('\n')
					.map((line) => JSON.parse(line));
				assert.ok(logs.some((log) => log.label === 'types'));
			}
		}
	});

	it('astro check writes a file without implicit terminal diagnostics', {
		skip: !!process.env.ECOSYSTEM_CI,
		timeout: 35000,
	}, async (t) => {
		const directory = await fs.mkdtemp(join(tmpdir(), 'astro-check-file-'));
		t.after(() => fs.rm(directory, { recursive: true, force: true }));
		const projectRoot = fileURLToPath(
			new URL('./fixtures/astro-check-no-errors/', import.meta.url),
		);
		const reporterFile = join(directory, 'report.json');
		const result = await cli(
			'check',
			'--root',
			projectRoot,
			'--reporter=json',
			'--reporter-file',
			reporterFile,
		).getResult();
		assert.equal(result.exitCode, 0, result.stderr);
		assert.equal(result.stdout, '');
		assert.match(result.stderr, /Generated/);
		assert.equal(JSON.parse(await fs.readFile(reporterFile, 'utf8')).version, 1);
	});

	it('astro check retains default stdout when explicitly combined with a file reporter', {
		skip: !!process.env.ECOSYSTEM_CI,
		timeout: 35000,
	}, async (t) => {
		const directory = await fs.mkdtemp(join(tmpdir(), 'astro-check-reporters-'));
		t.after(() => fs.rm(directory, { recursive: true, force: true }));
		const projectRoot = fileURLToPath(
			new URL('./fixtures/astro-check-no-errors/', import.meta.url),
		);
		const reporterFile = join(directory, 'report.json');
		const result = await cli(
			'check',
			'--root',
			projectRoot,
			'--noSync',
			'--reporter=default',
			'--reporter=json',
			'--reporter-file',
			reporterFile,
		).getResult();
		assert.equal(result.exitCode, 0, result.stderr);
		assert.match(result.stdout, /Getting diagnostics/);
		assert.match(result.stdout, /0 errors/);
		assert.equal(JSON.parse(await fs.readFile(reporterFile, 'utf8')).version, 1);
	});

	it('astro check validates reporters before loading the project config', async () => {
		const projectRoot = fileURLToPath(
			new URL('./fixtures/astro-check-no-errors/', import.meta.url),
		);
		const result = await cli(
			'check',
			'--root',
			projectRoot,
			'--config',
			'missing-config.mjs',
			'--reporter=unknown',
		).getResult();
		assert.equal(result.exitCode, 1);
		assert.match(result.stderr, /reporter/i);
		assert.ok(!result.stderr.includes('missing-config.mjs'));
		assert.equal(result.stdout, '');
	});

	it('astro check supports installed check packages without reporter selection', async (t) => {
		const projectRoot = await fs.mkdtemp(join(tmpdir(), 'astro-check-package-'));
		t.after(() => fs.rm(projectRoot, { recursive: true, force: true }));
		for (const name of ['@astrojs/check', 'typescript']) {
			const packageRoot = join(projectRoot, 'node_modules', name);
			await fs.mkdir(packageRoot, { recursive: true });
			await fs.writeFile(
				join(packageRoot, 'package.json'),
				JSON.stringify({ name, version: '6.0.0', type: 'module', main: 'index.js' }),
			);
			await fs.writeFile(
				join(packageRoot, 'index.js'),
				name === 'typescript'
					? 'export {};\n'
					: `
export function parseArgsAsCheckConfig(args) {
  return { root: args[args.indexOf('--root') + 1] };
}
export function check() {
  console.info('Installed checker completed');
  return false;
}
`,
			);
		}
		const result = await cli('check', '--root', projectRoot, '--noSync').getResult();
		assert.equal(result.exitCode, 0, result.stderr);
		assert.match(result.stdout, /Getting diagnostics/);
		assert.match(result.stdout, /Installed checker completed/);
	});

	it('astro check explains TypeScript 7 support', async () => {
		const projectRoot = await fs.mkdtemp(join(tmpdir(), 'astro-check-ts7-'));
		const typescriptRoot = join(projectRoot, 'node_modules', 'typescript');

		try {
			await fs.mkdir(typescriptRoot, { recursive: true });
			await fs.writeFile(
				join(typescriptRoot, 'package.json'),
				JSON.stringify({
					name: 'typescript',
					version: '7.0.2',
					type: 'module',
					exports: { './package.json': './package.json' },
				}),
			);

			const result = await cli('check', '--root', projectRoot, '--noSync').getResult();

			assert.match(result.stderr, /does not currently support TypeScript 7\.0/);
		} finally {
			await fs.rm(projectRoot, { recursive: true, force: true });
		}
	});
});
