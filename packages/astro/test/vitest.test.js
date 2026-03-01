import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createVitest } from 'vitest/node';

describe('vitest', () => {
	let originalCwd;
	before(() => {
		originalCwd = process.cwd();
		// We chdir rather than setting the root in vitest, because otherwise it sets the wrong root in the site config
		process.chdir(fileURLToPath(new URL('./fixtures/vitest/', import.meta.url)));
	});

	it('basics', async () => {
		const vitest = await createVitest('test', {
			watch: false,
		});

		try {
			await vitest.start();
		} catch (_) {
			assert.ok(false, 'test failed');
		} finally {
			await vitest.close();
		}
	});

	after(() => {
		process.chdir(originalCwd);
	});
});
