import { expect } from 'chai';

import { execa } from 'execa';
import fs from 'node:fs';

import { git } from '../dist/index.js';
import { setup } from './utils.js';

describe('git', () => {
	const fixture = setup();

	it('none', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ git: false }) };
		await git(context);

		expect(fixture.hasMessage('Skipping Git initialization')).to.be.true;
	});

	it('already initialized', async () => {
		const context = {
			git: true,
			cwd: './test/fixtures/not-empty',
			dryRun: true,
			prompt: () => ({ git: false }),
		};
		await execa('git', ['init'], { cwd: './test/fixtures/not-empty' });
		await git(context);

		expect(fixture.hasMessage('Git has already been initialized')).to.be.true;

		// Cleanup
		fs.rmSync('./test/fixtures/not-empty/.git', { recursive: true, force: true });
	});

	it('yes (--dry-run)', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ git: true }) };
		await git(context);

		expect(fixture.hasMessage('Skipping Git initialization')).to.be.true;
	});

	it('no (--dry-run)', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ git: false }) };
		await git(context);

		expect(fixture.hasMessage('Skipping Git initialization')).to.be.true;
	});
});
