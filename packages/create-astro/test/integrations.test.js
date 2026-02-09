import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dependencies } from '../dist/index.js';
import { setup } from './utils.js';

describe('integrations', () => {
	const fixture = setup();

	it('--add node', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			add: ['node'],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('--dry-run Skipping dependency installation and adding node'));
	});

	it('--add node --add react', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			add: ['node', 'react'],
		};

		await dependencies(context);

		assert.ok(
			fixture.hasMessage('--dry-run Skipping dependency installation and adding node, react'),
		);
	});

	it('--add node,react', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			add: ['node,react'],
		};

		await dependencies(context);

		assert.ok(
			fixture.hasMessage('--dry-run Skipping dependency installation and adding node, react'),
		);
	});

	it('-y', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
		};
		await dependencies(context);
		assert.ok(fixture.hasMessage('--dry-run Skipping dependency installation'));
	});

	describe('Security: Command injection protection', () => {
		it('blocks semicolon command injection', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['react;whoami'],
			};

			await assert.rejects(
				() => dependencies(context),
				/Invalid package name/,
				'Should reject command injection with semicolon',
			);
		});

		it('blocks command substitution with $()', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['react$(whoami)'],
			};

			await assert.rejects(
				() => dependencies(context),
				/Invalid package name/,
				'Should reject command substitution with $()',
			);
		});

		it('blocks command substitution with backticks', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['react`whoami`'],
			};

			await assert.rejects(
				() => dependencies(context),
				/Invalid package name/,
				'Should reject command substitution with backticks',
			);
		});

		it('blocks pipe operators', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['react|whoami'],
			};

			await assert.rejects(
				() => dependencies(context),
				/Invalid package name/,
				'Should reject pipe operator injection',
			);
		});

		it('blocks ampersand operators', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['react&&whoami'],
			};

			await assert.rejects(
				() => dependencies(context),
				/Invalid package name/,
				'Should reject ampersand operator injection',
			);
		});

		it('blocks redirect operators', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['react>file'],
			};

			await assert.rejects(
				() => dependencies(context),
				/Invalid package name/,
				'Should reject redirect operator injection',
			);
		});

		it('allows scoped packages', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['@astrojs/tailwind'],
			};

			await dependencies(context);
			assert.ok(
				fixture.hasMessage(
					'--dry-run Skipping dependency installation and adding @astrojs/tailwind',
				),
			);
		});

		it('allows valid package names', async () => {
			const context = {
				cwd: '',
				yes: true,
				packageManager: 'npm',
				dryRun: true,
				add: ['my-package', 'package_2.0'],
			};

			await dependencies(context);
			assert.ok(
				fixture.hasMessage(
					'--dry-run Skipping dependency installation and adding my-package, package_2.0',
				),
			);
		});
	});
});
