import { expect } from 'chai';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { typescript, setupTypeScript } from '../dist/index.js';
import { setup, resetFixtures } from './utils.js';
import { describe } from 'node:test';

describe('typescript', () => {
	const fixture = setup();

	it('none', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ ts: 'strict', useTs: true }) };
		await typescript(context);

		expect(fixture.hasMessage('Skipping TypeScript setup')).to.be.true;
	});

	it('use false', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ ts: 'strict', useTs: false }) };
		await typescript(context);

		expect(fixture.hasMessage('No worries')).to.be.true;
	});

	it('strict', async () => {
		const context = {
			typescript: 'strict',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);

		expect(fixture.hasMessage('Using strict TypeScript configuration')).to.be.true;
		expect(fixture.hasMessage('Skipping TypeScript setup')).to.be.true;
	});

	it('default', async () => {
		const context = {
			typescript: 'default',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);

		expect(fixture.hasMessage('Using default TypeScript configuration')).to.be.true;
		expect(fixture.hasMessage('Skipping TypeScript setup')).to.be.true;
	});

	it('relaxed', async () => {
		const context = {
			typescript: 'relaxed',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);

		expect(fixture.hasMessage('Using relaxed TypeScript configuration')).to.be.true;
		expect(fixture.hasMessage('Skipping TypeScript setup')).to.be.true;
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
		expect(err).to.eq(1);
	});
});

describe('typescript: setup tsconfig', () => {
	beforeEach(() => resetFixtures());
	
	it('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);

		await setupTypeScript('strict', { cwd: fileURLToPath(root) });
		expect(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' }))).to.deep.eq({
			extends: 'astro/tsconfigs/strict',
		});
	});

	it('exists', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);
		await setupTypeScript('strict', { cwd: fileURLToPath(root) });
		expect(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' }))).to.deep.eq({
			extends: 'astro/tsconfigs/strict',
		});
	});
});

describe('typescript: setup package', () => {
	beforeEach(() => resetFixtures());

	it('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const packageJson = new URL('./package.json', root);

		await setupTypeScript('strictest', { cwd: fileURLToPath(root), install: false });
		expect(fs.existsSync(packageJson)).to.be.false;
	});

	it('none', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const packageJson = new URL('./package.json', root);

		expect(JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf-8' })).scripts.build).to.be.eq(
			'astro build'
		);
		await setupTypeScript('strictest', { cwd: fileURLToPath(root), install: false });
		const { scripts } = JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf-8' }));
		
		expect(Object.keys(scripts)).to.deep.eq(['dev', 'build', 'preview'], 'does not override existing scripts');
		expect(scripts.build).to.eq(
			'astro check && astro build',
			'prepends astro check command'
		);
	});
});
