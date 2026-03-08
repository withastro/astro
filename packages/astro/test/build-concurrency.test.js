import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Building with concurrency > 1', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/build-concurrency/',
			build: {
				concurrency: 2,
			},
		});
	});

	it('Errors and exits', async () => {
		let built = false;
		try {
			await fixture.build();
			built = true;
		} catch (err) {
			assert.match(err.message, /This is a test/);
		}

		assert.equal(built, false, 'Build should not complete');
	});
});
