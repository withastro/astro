import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dependencies } from '../dist/index.js';
import { type DependenciesContext, mockPrompt, setup } from './test-utils.ts';

describe('dependencies', () => {
	const fixture = setup();

	it('--yes', async () => {
		const context: DependenciesContext = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: true }),
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
	});

	it('--yes with third-party template warns', async () => {
		const context: DependenciesContext = {
			cwd: '',
			yes: true,
			template: 'github:someone/starter',
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: true }),
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Third-party template detected'));
	});

	it('starlight templates do not warn', async () => {
		const context: DependenciesContext = {
			cwd: '',
			yes: true,
			template: 'starlight/tailwind',
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: true }),
			tasks: [],
		};

		await dependencies(context);

		assert.equal(fixture.hasMessage('Third-party template detected'), false);
	});

	it('starlight-prefixed third-party templates warn', async () => {
		const context: DependenciesContext = {
			cwd: '',
			yes: true,
			template: 'starlightevil/foo',
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: true }),
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Third-party template detected'));
	});

	it('warns without --yes when install is enabled', async () => {
		const context: DependenciesContext = {
			cwd: '',
			install: true,
			template: 'github:someone/starter',
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: true }),
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Third-party template detected'));
	});

	it('prompt yes', async () => {
		const context: DependenciesContext = {
			cwd: '',
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: true }),
			install: undefined,
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, true);
	});

	it('prompt no', async () => {
		const context: DependenciesContext = {
			cwd: '',
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: false }),
			install: undefined,
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, false);
	});

	it('--install', async () => {
		const context: DependenciesContext = {
			cwd: '',
			install: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: false }),
			tasks: [],
		};
		await dependencies(context);
		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, true);
	});

	it('--no-install ', async () => {
		const context: DependenciesContext = {
			cwd: '',
			install: false,
			packageManager: 'npm',
			dryRun: true,
			prompt: mockPrompt({ deps: false }),
			tasks: [],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Skipping dependency installation'));
		assert.equal(context.install, false);
	});

	describe('--add', async () => {
		it('fails for non-supported integration', async () => {
			let context: DependenciesContext = {
				cwd: '',
				add: ['foo '],
				dryRun: true,
				prompt: mockPrompt({ deps: false }),
				packageManager: 'npm',
				tasks: [],
			};

			try {
				await dependencies(context);
				assert.fail('The function should throw an error');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(
					error.message.includes('Invalid package name "foo "'),
					`Expected error about invalid package name, got: ${error.message}`,
				);
			}
			context = {
				cwd: '',
				add: ['react', 'bar lorem'],
				dryRun: true,
				prompt: mockPrompt({ deps: false }),
				packageManager: 'npm',
				tasks: [],
			};

			try {
				await dependencies(context);
				assert.fail('The function should throw an error');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(
					error.message.includes('Invalid package name "bar lorem"'),
					`Expected error about invalid package name, got: ${error.message}`,
				);
			}
		});
	});
});
