import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { projectName } from '../dist/index.js';
import { mockExit, mockPrompt, type ProjectNameContext, setup } from './test-utils.ts';

describe('project name', async () => {
	const fixture = setup();

	it('pass in name', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './foo/bar/baz',
			prompt: mockPrompt({}),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.cwd, './foo/bar/baz');
		assert.equal(context.projectName, 'baz');
	});

	it('dot', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '.',
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.ok(fixture.hasMessage('"." is not empty!'));
		assert.equal(context.projectName, 'foobar');
	});

	it('dot slash', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './',
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.ok(fixture.hasMessage('"./" is not empty!'));
		assert.equal(context.projectName, 'foobar');
	});

	it('empty', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './test/fixtures/empty',
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.ok(!fixture.hasMessage('"./test/fixtures/empty" is not empty!'));
		assert.equal(context.projectName, 'empty');
	});

	it('not empty', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './test/fixtures/not-empty',
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.ok(fixture.hasMessage('"./test/fixtures/not-empty" is not empty!'));
		assert.equal(context.projectName, 'foobar');
	});

	it('basic', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '',
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.cwd, 'foobar');
		assert.equal(context.projectName, 'foobar');
	});

	it('head and tail blank spaces should be trimmed', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '',
			prompt: mockPrompt({ name: '  foobar  ' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.cwd, 'foobar');
		assert.equal(context.projectName, 'foobar');
	});

	it('normalize', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '',
			prompt: mockPrompt({ name: 'Invalid Name' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.cwd, 'Invalid Name');
		assert.equal(context.projectName, 'invalid-name');
	});

	it('remove leading/trailing dashes', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '',
			prompt: mockPrompt({ name: '(invalid)' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.projectName, 'invalid');
	});

	it('handles scoped packages', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '',
			prompt: mockPrompt({ name: '@astro/site' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.cwd, '@astro/site');
		assert.equal(context.projectName, '@astro/site');
	});

	it('--yes', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './foo/bar/baz',
			yes: true,
			prompt: mockPrompt({}),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.projectName, 'baz');
	});

	it('dry run with name', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './foo/bar/baz',
			dryRun: true,
			prompt: mockPrompt({}),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.projectName, 'baz');
	});

	it('dry run with dot', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: '.',
			dryRun: true,
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.projectName, 'foobar');
	});

	it('dry run with empty', async () => {
		const context: ProjectNameContext = {
			projectName: '',
			cwd: './test/fixtures/empty',
			dryRun: true,
			prompt: mockPrompt({ name: 'foobar' }),
			exit: mockExit,
		};
		await projectName(context);
		assert.equal(context.projectName, 'empty');
	});
});
