import { describe, test, expect } from 'vitest'
import fs from 'fs';
import { execa } from 'execa';

import { git } from '../src/actions/git.js';
import { setup } from './utils.js';

describe('git', () => {
	const fixture = setup();

	test('none', async () => {
		const context = { cwd: '', dryRun: true, prompt: (() => ({ git: false })) as any };
		await git(context);

		expect(fixture.hasMessage('Skipping Git initialization')).toBeTruthy();
	})

	test('already initialized', async () => {
		const context = { git: true, cwd: './test/fixtures/not-empty', dryRun: true, prompt: (() => ({ git: false })) as any };
		await execa('git', ['init'], { cwd: './test/fixtures/not-empty' });
		await git(context);

		expect(fixture.hasMessage('Git has already been initialized')).toBeTruthy();

		// Cleanup
		fs.rmSync('./test/fixtures/not-empty/.git', { recursive: true, force: true });
	})

	test('yes (--dry-run)', async () => {
		const context = { cwd: '', dryRun: true, prompt: (() => ({ git: true })) as any };
		await git(context);

		expect(fixture.hasMessage('Skipping Git initialization')).toBeTruthy();
	})

	test('no (--dry-run)', async () => {
		const context = { cwd: '', dryRun: true, prompt: (() => ({ git: false })) as any };
		await git(context);

		expect(fixture.hasMessage('Skipping Git initialization')).toBeTruthy();
	})
})
