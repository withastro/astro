import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from '../../../../astro/test/test-utils.js';

describe('Image validation when is not size specification in netlify.', () => {
	it('throw on missing dimension in static build', async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/image-missing-dimension/', import.meta.url)
		});

		let error = null;
		try{
			await fixture.build();
		} catch (e) {
			error = e;
			console.error("Caught Error Name:", e.name);
		}

		// The build should fail if mandatory dimensions are missing
		assert.notEqual(
			error,
			null,
			`Build succeeded, but it should have failed due to missing dimensions.`
		)

		// check the error image about missing image dimension
		assert.match(
			error.name,
			/MissingImageDimension/,
			`Build failed but not with the expected "MissingImageDimension"`
		)
	})
})
