import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Import astro jsx runtime', async () => {
	it('Successfully imports astro/jsx-runtime', async () => {
		try {
			await import('astro/jsx-runtime');
			assert.equal(true, true);
		} catch (err) {
			assert.fail(
				undefined,
				undefined,
				`Importing astro/jsx-runtime should not throw an error: ${err}`,
			);
		}
	});

	it('Successfully imports astro/jsx-dev-runtime', async () => {
		try {
			await import('astro/jsx-dev-runtime');
			assert.equal(true, true);
		} catch (err) {
			assert.fail(
				undefined,
				undefined,
				`Importing astro/jsx-dev-runtime should not throw an error: ${err}`,
			);
		}
	});
});
