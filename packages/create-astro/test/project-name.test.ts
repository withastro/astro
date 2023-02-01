import { describe, test, expect } from 'vitest'

import { projectName } from '../src/actions/project-name.js';
import { setup } from './utils.js';

describe('project name', () => {
	const fixture = setup();

	test('pass in name', async () => {
		const context = { projectName: '', cwd: './foo/bar/baz', prompt: (() => {}) as any };
		await projectName(context);

		expect(context.cwd).toBe('./foo/bar/baz');
		expect(context.projectName).toBe('baz');
	})

	test('dot', async () => {
		const context = { projectName: '', cwd: '.', prompt: (() => ({ name: 'foobar' })) as any };
		await projectName(context);

		expect(fixture.hasMessage('Hmm... "." is not empty!')).toBeTruthy();
		expect(context.projectName).toBe('foobar');
	})

	test('dot slash', async () => {
		const context = { projectName: '', cwd: './', prompt: (() => ({ name: 'foobar' })) as any };
		await projectName(context);

		expect(fixture.hasMessage('Hmm... "./" is not empty!')).toBeTruthy();
		expect(context.projectName).toBe('foobar');
	})

	test('empty', async () => {
		const context = { projectName: '', cwd: './test/fixtures/empty', prompt: (() => ({ name: 'foobar' })) as any };		await projectName(context);

		expect(fixture.hasMessage('Hmm... "./test/fixtures/empty" is not empty!')).toBeFalsy();
		expect(context.projectName).toBe('empty');
	})

	test('not empty', async () => {
		const context = { projectName: '', cwd: './test/fixtures/not-empty', prompt: (() => ({ name: 'foobar' })) as any };
		await projectName(context);

		expect(fixture.hasMessage('Hmm... "./test/fixtures/not-empty" is not empty!')).toBeTruthy();
		expect(context.projectName).toBe('foobar');
	})

	test('basic', async () => {
		const context = { projectName: '', cwd: '', prompt: (() => ({ name: 'foobar' })) as any };
		await projectName(context);

		expect(context.cwd).toBe('foobar');
		expect(context.projectName).toBe('foobar');
	})

	test('normalize', async () => {
		const context = { projectName: '', cwd: '', prompt: (() => ({ name: 'Invalid Name' })) as any };
		await projectName(context);

		expect(context.cwd).toBe('Invalid Name');
		expect(context.projectName).toBe('invalid-name');
	})
})
