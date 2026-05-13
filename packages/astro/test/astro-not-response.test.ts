import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Not returning responses', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-not-response/',
			outDir: './dist/astro-not-response/',
		});
	});

	it('Does not work from a page', async () => {
		try {
			await fixture.build();
		} catch (e) {
			assert.equal(
				e instanceof Error,
				true,
				'Only instance of Response can be returned from an Astro file',
			);
			return;
		}

		assert.fail('Should have thrown an error');
	});
});
