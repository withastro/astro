import assert from 'node:assert';
import { describe, it } from 'node:test';
import path from 'path';
import { check } from '../dist/index.js';

describe('astro-check - js api', async () => {
	it('can check a project', async () => {
		const hasError = await check({
			root: './fixture',
			tsconfig: path.resolve(process.cwd(), './test/fixture/tsconfig.json'),
		});

		assert.notStrictEqual(hasError, undefined);
		assert.strictEqual(hasError, true);
	});

	// TODO: Test `watch` option once we have a way to pass a custom logger
});
