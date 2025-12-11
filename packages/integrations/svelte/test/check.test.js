import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { cli } from '../../../astro/test/test-utils.js';

describe('Svelte Check', () => {
	it('should fail check on type error', async () => {
		const root = fileURLToPath(new URL('./fixtures/prop-types/', import.meta.url));
		const { getResult } = cli('check', '--root', root);
		const { exitCode, stdout } = await getResult();

		assert.equal(exitCode, 1, 'Expected check to fail (exit code 1)');
		assert.ok(
			stdout.includes(`Type 'string' is not assignable to type 'number'`),
			'Expected specific type error message',
		);
	});
});
