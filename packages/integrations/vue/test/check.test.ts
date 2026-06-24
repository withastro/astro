import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { cli } from './test-utils.ts';

describe('Vue Check', () => {
	it('should pass check for client directives and HTML attributes on Vue components', async () => {
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

	it('should pass check for Vue library components with __VLS_WithTemplateSlots types', async () => {
		const root = fileURLToPath(
			new URL('./fixtures/prop-types/types/library-component', import.meta.url),
		);
		const tsConfigPath = fileURLToPath(
			new URL('./fixtures/prop-types/tsconfig.library-component.json', import.meta.url),
		);
		const { getResult } = cli('check', '--tsconfig', tsConfigPath, '--root', root);
		const { exitCode, stdout, stderr } = await getResult();

		if (exitCode !== 0) {
			console.error(stdout);
			console.error(stderr);
		}
		assert.equal(exitCode, 0, 'Expected check to pass (exit code 0)');
	});
});
