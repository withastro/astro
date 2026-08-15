import assert from 'node:assert';
import { describe, it } from 'node:test';
import { resolveTypeScriptPath } from '../dist/index.js';

describe('resolveTypeScriptPath', () => {
	it('returns the resolved path when resolution succeeds', () => {
		const result = resolveTypeScriptPath(() => '/some/path/to/typescript/lib/typescript.js');
		assert.strictEqual(result, '/some/path/to/typescript/lib/typescript.js');
	});

	it('returns undefined when typescript has no default export map entry (e.g. TypeScript 7)', () => {
		const result = resolveTypeScriptPath(() => {
			const err = new Error('ERR_PACKAGE_PATH_NOT_EXPORTED') as NodeJS.ErrnoException;
			err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
			throw err;
		});
		assert.strictEqual(result, undefined);
	});

	it('rethrows other resolution errors (e.g. package genuinely not installed)', () => {
		assert.throws(
			() =>
				resolveTypeScriptPath(() => {
					const err = new Error('Cannot find module') as NodeJS.ErrnoException;
					err.code = 'MODULE_NOT_FOUND';
					throw err;
				}),
			/Cannot find module/,
		);
	});
});
