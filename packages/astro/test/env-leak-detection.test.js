import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('astro:env leak detection', () => {
	it('should fail if a secret is sent to the client', async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-env-leak-detection/',
		});

		let error;
		try {
			await fixture.build();
		} catch (err) {
			error = err;
		}

		assert.equal(error instanceof Error, true);
		assert.equal(error.message.includes('leaked client-side'), true);
	});
});
