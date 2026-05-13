import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Errors information in build', () => {
	let fixture: Fixture;

	it('includes the file where the error happened', async () => {
		fixture = await loadFixture({
			root: './fixtures/error-build-location',
		});

		let errorContent: any;
		try {
			await fixture.build();
		} catch (e) {
			errorContent = e;
		}

		assert.equal(errorContent.id, 'src/pages/index.astro');
		assert.equal(errorContent.message, `I'm happening in build!`);
	});
});
