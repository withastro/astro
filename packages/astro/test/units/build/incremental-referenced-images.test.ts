import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { restoreReferencedImages } from '../../../dist/assets/build/generate.js';

function resetAstroAsset() {
	delete (globalThis as any).astroAsset;
}

describe('restoreReferencedImages', () => {
	afterEach(resetAstroAsset);

	it('merges restored image references with rendered references', () => {
		const renderedPath = '/project/src/assets/hero.png';
		const restoredPath = '/project/src/assets/shared.png';
		globalThis.astroAsset = { referencedImages: new Set([renderedPath]) };

		restoreReferencedImages([restoredPath]);

		assert.deepEqual(globalThis.astroAsset.referencedImages, new Set([renderedPath, restoredPath]));
	});

	it('creates the global asset state when absent', () => {
		restoreReferencedImages(['/project/src/assets/shared.png']);

		assert.ok(globalThis.astroAsset?.referencedImages?.has('/project/src/assets/shared.png'));
	});
});
