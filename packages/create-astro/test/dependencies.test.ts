import { describe, test, expect } from 'vitest'

import { dependencies } from '../src/actions/dependencies.js';
import { setup } from './utils.js';

describe('dependencies', () => {
	const fixture = setup();

	test('--yes', async () => {
		const context = { cwd: '', yes: true, pkgManager: 'npm', dryRun: true, prompt: (() => ({ deps: true })) as any};
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).toBeTruthy();
	})

	test('prompt yes', async () => {
		const context = { cwd: '', pkgManager: 'npm', dryRun: true, prompt: (() => ({ deps: true })) as any, install: undefined };
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).toBeTruthy();
		expect(context.install).toBe(true);
	})

	test('prompt no', async () => {
		const context = { cwd: '', pkgManager: 'npm', dryRun: true, prompt: (() => ({ deps: false })) as any, install: undefined };
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).toBeTruthy();
		expect(context.install).toBe(false);
	})

	test('--install', async () => {
		const context = { cwd: '', install: true, pkgManager: 'npm', dryRun: true, prompt: (() => ({ deps: false })) as any };
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).toBeTruthy();
		expect(context.install).toBe(true);
	})

	test('--no-install', async () => {
		const context = { cwd: '', install: false, pkgManager: 'npm', dryRun: true, prompt: (() => ({ deps: false })) as any };
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).toBeTruthy();
		expect(context.install).toBe(false);
	})
})
