import { expect } from 'chai';

import { install } from '../dist/index.js';
import { setup } from './utils.js';

describe('install', () => {
	const fixture = setup();

	it('--yes', async () => {
		const context = {
			cwd: '',
			yes: true,
			pkgManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
		};
		await install(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
	});

	it('prompt yes', async () => {
		const context = {
			cwd: '',
			pkgManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
			install: undefined,
		};
		await install(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(true);
	});

	it('prompt no', async () => {
		const context = {
			cwd: '',
			pkgManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
			install: undefined,
		};
		await install(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(false);
	});

	it('--install', async () => {
		const context = {
			cwd: '',
			install: true,
			pkgManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
		};
		await install(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(true);
	});

	it('--no-install', async () => {
		const context = {
			cwd: '',
			install: false,
			pkgManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
		};
		await install(context);
		expect(fixture.hasMessage('Skipping dependency installation')).to.be.true;
		expect(context.install).to.eq(false);
	});
});
