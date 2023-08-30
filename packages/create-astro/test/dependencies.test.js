import { expect } from 'chai';

import { dependencies } from '../dist/index.js';
import { setup } from './utils.js';

describe('dependencies', () => {
	const fixture = setup();

	it('--yes', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
		};
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
	});

	it('prompt yes', async () => {
		const context = {
			cwd: '',
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
			install: undefined,
		};
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(true);
	});

	it('prompt no', async () => {
		const context = {
			cwd: '',
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
			install: undefined,
		};
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(false);
	});

	it('--install', async () => {
		const context = {
			cwd: '',
			install: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
		};
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(true);
	});

	it('--no-install', async () => {
		const context = {
			cwd: '',
			install: false,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
		};
		await dependencies(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(false);
	});
});
