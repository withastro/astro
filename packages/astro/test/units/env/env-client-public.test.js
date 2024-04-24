import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from '../../test-utils.js';

describe('astro:env client/public variables', () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-env/',
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('builds without throwing', async () => {
			assert.equal(true, true);
		});

		it('does render public env and private env', async () => {
			let indexHtml = await fixture.readFile('/index.html');

			assert.equal(indexHtml.includes('ABC'), true);
			assert.equal(indexHtml.includes('DEF'), true);
		});
	});
});
