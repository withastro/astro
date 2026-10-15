import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rolldown } from 'rolldown';

describe('Bundle for browsers', async () => {
	it('rolldown browser build should work', async () => {
		try {
			const bundle = await rolldown({
				input: '@astrojs/markdown-remark',
				platform: 'browser',
			});
			try {
				const result = await bundle.generate({ format: 'esm' });
				assert.ok(result.output.length > 0);
			} finally {
				await bundle.close();
			}
		} catch (error) {
			// Capture any rolldown errors and fail the test
			assert.fail((error as Error).message);
		}
	});
});
