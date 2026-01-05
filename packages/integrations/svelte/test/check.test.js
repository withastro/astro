import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { cli } from '../../../astro/test/test-utils.js';

describe('Svelte Check', () => {
	it('should fail check on type error', async () => {
		const root = fileURLToPath(new URL('./fixtures/prop-types/types/props', import.meta.url));
		const tsConfigPath = fileURLToPath(
			new URL('./fixtures/prop-types/tsconfig.props.json', import.meta.url),
		);
		const { getResult } = cli('check', '--tsconfig', tsConfigPath, '--root', root);
		const { exitCode, stdout } = await getResult();

		assert.equal(exitCode, 1, 'Expected check to fail (exit code 1)');
		assert.ok(
			stdout.includes(`Type 'string' is not assignable to type 'number'`),
			'Expected specific type error message',
		);
	});

	it('should pass check for client directives on strict and arbitrary components', async () => {
		const root = fileURLToPath(new URL('./fixtures/prop-types/types/directive', import.meta.url));
		const tsConfigPath = fileURLToPath(
			new URL('./fixtures/prop-types/tsconfig.directive.json', import.meta.url),
		);
		const { getResult } = cli('check', '--tsconfig', tsConfigPath, '--root', root);
		const { exitCode, stdout, stderr } = await getResult();

		if (exitCode !== 0) {
			console.error(stdout);
			console.error(stderr);
		}
		assert.equal(exitCode, 0, 'Expected check to pass (exit code 0)');
	});

	it('should pass check on valid children usage', async () => {
		const root = fileURLToPath(new URL('./fixtures/prop-types/types/children', import.meta.url));
		const tsConfigPath = fileURLToPath(
			new URL('./fixtures/prop-types/tsconfig.children-pass.json', import.meta.url),
		);
		const { getResult } = cli('check', '--tsconfig', tsConfigPath, '--root', root);
		const { exitCode, stdout, stderr } = await getResult();

		if (exitCode !== 0) {
			console.error(stdout);
			console.error(stderr);
		}
		assert.equal(exitCode, 0, 'Expected check to pass (exit code 0)');
	});

	it('should fail check on invalid text children', async () => {
		const root = fileURLToPath(new URL('./fixtures/prop-types/types/children', import.meta.url));
		const tsConfigPath = fileURLToPath(
			new URL('./fixtures/prop-types/tsconfig.children-fail.json', import.meta.url),
		);
		const { getResult } = cli('check', '--tsconfig', tsConfigPath, '--root', root);
		const { exitCode, stdout } = await getResult();

		assert.equal(exitCode, 1, 'Expected check to fail (exit code 1)');
		assert.ok(
			stdout.includes(`'Empty' components don't accept text`),
			'Expected Empty component error',
		);
		assert.ok(
			stdout.includes(`'EmptyV5' components don't accept text`),
			'Expected EmptyV5 component error',
		);
	});

	it('should fail check on invalid element children', { skip: true }, async () => {
		const root = fileURLToPath(new URL('./fixtures/prop-types/types/children', import.meta.url));
		const tsConfigPath = fileURLToPath(
			new URL('./fixtures/prop-types/tsconfig.children-fail-element.json', import.meta.url),
		);
		const { getResult } = cli('check', '--tsconfig', tsConfigPath, '--root', root);
		const { exitCode } = await getResult();

		assert.equal(exitCode, 1, 'Expected check to fail (exit code 1)');
	});
});
