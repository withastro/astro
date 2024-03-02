import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Integration injectRoute entrypoint', () => {
	it('injectRoute entrypoint should not fail build if containing `.astro` before the extension', async () => {
		const fixture = await loadFixture({ root: './fixtures/integration-inject-route-entrypoint/' });

		let error = false;
		try {
			await fixture.build()
		} catch (err) {
			error = true
		}
		assert.equal(error, false);
	});
});
