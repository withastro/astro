import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
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

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, true);
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

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, false);
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
		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, true);
	});

	it('--no-install ', async () => {
		const context = {
			cwd: '',
			install: false,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: false }),
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, false);
	});

	describe('--add', async () => {
		it('fails for non-supported integration', async () => {
			let context = {
				cwd: '',
				add: ['foo '],
				dryRun: true,
				prompt: () => ({ deps: false }),
			};

			try {
				await dependencies(context);
				assert.fail('The function should throw an error');
			} catch (error) {
				assert.ok(
					error.message.includes('Invalid package name "foo "'),
					`Expected error about invalid package name, got: ${error.message}`,
				);
			}
			context = {
				cwd: '',
				add: ['react', 'bar lorem'],
				dryRun: true,
				prompt: () => ({ deps: false }),
			};

			try {
				await dependencies(context);
				assert.fail('The function should throw an error');
			} catch (error) {
				assert.ok(
					error.message.includes('Invalid package name "bar lorem"'),
					`Expected error about invalid package name, got: ${error.message}`,
				);
			}
		});
	});
});
