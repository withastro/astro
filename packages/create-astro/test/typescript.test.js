import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { setupTypeScript, typescript } from '../dist/index.js';
import { resetFixtures, setup } from './utils.js';

describe('typescript', async () => {
	const fixture = setup();

	it('none', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ ts: 'strict', useTs: true }) };
		await typescript(context);

		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('use false', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ ts: 'strict', useTs: false }) };
		await typescript(context);

		assert.ok(fixture.hasMessage('No worries'));
	});

	it('strict', async () => {
		const context = {
			typescript: 'strict',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);
		assert.ok(fixture.hasMessage('Using strict TypeScript configuration'));
		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('default', async () => {
		const context = {
			typescript: 'default',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);
		assert.ok(fixture.hasMessage('Using default TypeScript configuration'));
		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('relaxed', async () => {
		const context = {
			typescript: 'relaxed',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);
		assert.ok(fixture.hasMessage('Using relaxed TypeScript configuration'));
		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('other', async () => {
		const context = {
			typescript: 'other',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
			exit(code) {
				throw code;
			},
		};
		let err = null;
		try {
			await typescript(context);
		} catch (e) {
			err = e;
		}
		assert.equal(err, 1);
	});
});

describe('typescript: setup tsconfig', async () => {
	beforeEach(() => resetFixtures());
	after(() => resetFixtures());

	it('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);

		await setupTypeScript('strict', { cwd: fileURLToPath(root) });
		assert.deepEqual(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' })), {
			extends: 'astro/tsconfigs/strict',
		});
		assert(
			fs.readFileSync(tsconfig, { encoding: 'utf-8' }).endsWith('\n'),
			'The file does not end with a newline',
		);
	});

	it('exists', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);
		await setupTypeScript('strict', { cwd: fileURLToPath(root) });
		assert.deepEqual(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' })), {
			extends: 'astro/tsconfigs/strict',
		});
		assert(
			fs.readFileSync(tsconfig, { encoding: 'utf-8' }).endsWith('\n'),
			'The file does not end with a newline',
		);
	});
});

describe('typescript: setup package', async () => {
	beforeEach(() => resetFixtures());
	after(() => resetFixtures());

	it('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const packageJson = new URL('./package.json', root);

		await setupTypeScript('strictest', { cwd: fileURLToPath(root), install: false });
		assert.ok(!fs.existsSync(packageJson));
	});

	it('none', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const packageJson = new URL('./package.json', root);
		assert.equal(
			JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf-8' })).scripts.build,
			'astro build',
		);

		await setupTypeScript('strictest', { cwd: fileURLToPath(root), install: false });
		assert(
			fs.readFileSync(packageJson, { encoding: 'utf-8' }).endsWith('\n'),
			'The file does not end with a newline',
		);
		const { scripts, dependencies } = JSON.parse(
			fs.readFileSync(packageJson, { encoding: 'utf-8' }),
		);

		assert.deepEqual(
			Object.keys(scripts),
			['dev', 'build', 'preview'],
			'does not override existing scripts',
		);

		for (const value of Object.values(dependencies)) {
			assert.doesNotMatch(value, /undefined$/, 'does not include undefined values');
		}

		assert.equal(scripts.build, 'astro check && astro build', 'prepends astro check command');
	});
});
