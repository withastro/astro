import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ALL_PIPELINE_FEATURES,
	PipelineFeatures,
	getUsedFeatures,
	markFeatureUsed,
	setUsedFeatures,
} from '../../../dist/core/fetch/features.js';
import { createManifest } from '../app/test-helpers.ts';

describe('features module', () => {
	it('getUsedFeatures defaults to 0', () => {
		assert.equal(getUsedFeatures(createManifest()), 0);
	});

	it('markFeatureUsed ORs bits into the bitmask', () => {
		const manifest = createManifest();
		markFeatureUsed(manifest, PipelineFeatures.redirects);
		assert.equal(getUsedFeatures(manifest), PipelineFeatures.redirects);

		markFeatureUsed(manifest, PipelineFeatures.actions);
		assert.equal(
			getUsedFeatures(manifest),
			PipelineFeatures.redirects | PipelineFeatures.actions,
		);

		// Marking the same feature again is a no-op.
		markFeatureUsed(manifest, PipelineFeatures.redirects);
		assert.equal(
			getUsedFeatures(manifest),
			PipelineFeatures.redirects | PipelineFeatures.actions,
		);
	});

	it('scopes the bitmask per manifest object', () => {
		const a = createManifest();
		const b = createManifest();
		markFeatureUsed(a, PipelineFeatures.i18n);
		assert.equal(getUsedFeatures(a), PipelineFeatures.i18n);
		assert.equal(getUsedFeatures(b), 0);
	});

	it('setUsedFeatures overwrites the raw bitmask', () => {
		const manifest = createManifest();
		markFeatureUsed(manifest, PipelineFeatures.sessions);
		setUsedFeatures(manifest, PipelineFeatures.cache);
		assert.equal(getUsedFeatures(manifest), PipelineFeatures.cache);
		setUsedFeatures(manifest, 0);
		assert.equal(getUsedFeatures(manifest), 0);
	});

	it('ALL_PIPELINE_FEATURES covers every feature bit', () => {
		let all = 0;
		for (const bit of Object.values(PipelineFeatures)) {
			all |= bit;
		}
		assert.equal(ALL_PIPELINE_FEATURES, all);
	});
});
