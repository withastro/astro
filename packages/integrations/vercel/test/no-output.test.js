import { loadFixture } from './test-utils.js';
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

describe('Missing output config', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/no-output/',
		});
	});

	it('throws during the build', async () => {
		let error = undefined;
		try {
			await fixture.build();
		} catch (err) {
			error = err;
		}
		assert.notEqual(error, undefined);
		assert.match(error.message, /output: "server"/);
	});
});
