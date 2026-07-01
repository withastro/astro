import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from '../test-utils.ts';

describe('Image validation when is not size specification in netlify.', () => {
	it('throw on missing dimension in static build', async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/image-missing-dimension/', import.meta.url),
		});

		try {
			await fixture.build();
			assert.fail();
		} catch (e) {
			// check the error image about missing image dimension
			assert.match(
				(e as Error).name,
				/MissingImageDimension/,
				`Build failed but not with the expected "MissingImageDimension"`,
			);
		}
	});
});
