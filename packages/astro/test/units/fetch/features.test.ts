import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ALL_FETCH_FEATURES,
	FetchFeatures,
	getUsedFeatures,
	markFeatureUsed,
} from '../../../dist/core/fetch/features.js';
import { createManifest } from '../app/test-helpers.ts';

describe('features module', () => {
	it('getUsedFeatures defaults to 0', () => {
		assert.equal(getUsedFeatures(createManifest()), 0);
	});

	it('markFeatureUsed ORs bits into the bitmask', () => {
		const manifest = createManifest();
		markFeatureUsed(manifest, FetchFeatures.redirects);
		assert.equal(getUsedFeatures(manifest), FetchFeatures.redirects);

		markFeatureUsed(manifest, FetchFeatures.actions);
		assert.equal(getUsedFeatures(manifest), FetchFeatures.redirects | FetchFeatures.actions);

		// Marking the same feature again is a no-op.
		markFeatureUsed(manifest, FetchFeatures.redirects);
		assert.equal(getUsedFeatures(manifest), FetchFeatures.redirects | FetchFeatures.actions);
	});

	it('scopes the bitmask per manifest object', () => {
		const a = createManifest();
		const b = createManifest();
		markFeatureUsed(a, FetchFeatures.i18n);
		assert.equal(getUsedFeatures(a), FetchFeatures.i18n);
		assert.equal(getUsedFeatures(b), 0);
	});

	it('ALL_FETCH_FEATURES covers every feature bit', () => {
		let all = 0;
		for (const bit of Object.values(FetchFeatures)) {
			all |= bit;
		}
		assert.equal(ALL_FETCH_FEATURES, all);
	});
});
