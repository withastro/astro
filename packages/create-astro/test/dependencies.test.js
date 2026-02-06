import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dependencies } from '../dist/index.js';
import { setup } from './utils.js';

describe('dependencies', () => {
	const fixture = setup();

	it('rejects integration names with shell metacharacters', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
			add: ['react; open -a Calculator.app;'],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Invalid integration name(s)'));
		assert.deepEqual(context.add, []);
	});

	it('accepts valid integration names', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
			add: ['react', '@astrojs/tailwind', 'vue'],
		};

		await dependencies(context);

		assert.ok(!fixture.hasMessage('Invalid integration name(s)'));
		assert.deepEqual(context.add, ['react', '@astrojs/tailwind', 'vue']);
	});

	it('filters out only invalid integration names', async () => {
		const context = {
			cwd: '',
			yes: true,
			packageManager: 'npm',
			dryRun: true,
			prompt: () => ({ deps: true }),
			add: ['react', 'vue; rm -rf /', 'svelte'],
		};

		await dependencies(context);

		assert.ok(fixture.hasMessage('Invalid integration name(s)'));
		assert.deepEqual(context.add, ['react', 'svelte']);
	});

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
			install: true,
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
});
