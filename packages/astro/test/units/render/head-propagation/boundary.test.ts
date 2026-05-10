import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isPropagatedAssetBoundary } from '../../../../dist/core/head-propagation/boundary.js';

describe('head propagation boundary detection', () => {
	it('detects propagated asset flag in query params', () => {
		assert.equal(isPropagatedAssetBoundary('/src/entry.mdx?astroPropagatedAssets'), true);
		assert.equal(isPropagatedAssetBoundary('/src/entry.mdx?x=1&astroPropagatedAssets&y=1'), true);
	});

	it('returns false for non-propagated IDs', () => {
		assert.equal(isPropagatedAssetBoundary('/src/entry.mdx'), false);
		assert.equal(isPropagatedAssetBoundary('not a valid url%%%'), false);
	});
});
