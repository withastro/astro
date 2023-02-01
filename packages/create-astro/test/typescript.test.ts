import { describe, test, expect, afterAll, vi } from 'vitest'

import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import { typescript, setupTypeScript } from '../src/actions/typescript.js';
import { setup } from './utils.js';

describe('typescript', () => {
	const fixture = setup();
	vi.spyOn(process, 'exit').mockImplementation((code): never => {
		throw new Error(`exit ${code}`);
	})
	afterAll(() => {
		vi.resetAllMocks();
	})

	test('none', async () => {
		const context = { cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict', useTs: true })) as any };
		await typescript(context);
		
		expect(fixture.hasMessage('Skipping TypeScript setup')).toBeTruthy();
	})

	test('use false', async () => {
		const context = { cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict', useTs: false })) as any };
		await typescript(context);

		expect(fixture.hasMessage('No worries.')).toBeTruthy();
	})

	test('strict', async () => {
		const context = { typescript: 'strict', cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict' })) as any };
		await typescript(context);

		expect(fixture.hasMessage('Using strict TypeScript configuration')).toBeTruthy();
		expect(fixture.hasMessage('Skipping TypeScript setup')).toBeTruthy();
	})

	test('default', async () => {
		const context = { typescript: 'default', cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict' })) as any };
		await typescript(context);

		expect(fixture.hasMessage('Using default TypeScript configuration')).toBeTruthy();
		expect(fixture.hasMessage('Skipping TypeScript setup')).toBeTruthy();
	})

	test('relaxed', async () => {
		const context = { typescript: 'relaxed', cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict' })) as any };
		await typescript(context);

		expect(fixture.hasMessage('Using relaxed TypeScript configuration')).toBeTruthy();
		expect(fixture.hasMessage('Skipping TypeScript setup')).toBeTruthy();
	})


	test('strictest', async () => {
		const context = { typescript: 'strictest', cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict' })) as any };
		await typescript(context);

		expect(fixture.hasMessage('Using strictest TypeScript configuration')).toBeTruthy();
		expect(fixture.hasMessage('Skipping TypeScript setup')).toBeTruthy();
	})

	test('other', async () => {
		const context = { typescript: 'other', cwd: '', dryRun: true, prompt: (() => ({ ts: 'strict' })) as any };
		let err = null;
		try {
			await typescript(context);
		} catch (e) {
			err = e;
		}
		expect(err).toBeTruthy()
	})
})

describe('typescript: setup', () => {
	test('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);

		await setupTypeScript('strict', { cwd: fileURLToPath(root) })
		expect(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' }))).toEqual({ "extends": "astro/tsconfigs/strict" });
		fs.rmSync(tsconfig);
	})

	test('exists', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);
		await setupTypeScript('strict', { cwd: fileURLToPath(root) })
		expect(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' }))).toEqual({ "extends": "astro/tsconfigs/strict" });
		fs.writeFileSync(tsconfig, `{}`);
	})
})
