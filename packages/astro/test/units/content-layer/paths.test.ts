import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDataStoreChunkSize } from '../../../dist/content/paths.js';
import { createMinimalSettings, createTempDir } from './test-helpers.ts';

describe('getDataStoreChunkSize', () => {
	it('uses the previous limit for the chunked shorthand', () => {
		const settings = createMinimalSettings(createTempDir(), {
			config: { experimental: { collectionStorage: 'chunked' } },
		});

		assert.equal(getDataStoreChunkSize(settings), 20 * 1024 * 1024);
	});

	it('uses the configured chunk size', () => {
		const settings = createMinimalSettings(createTempDir(), {
			config: {
				experimental: {
					collectionStorage: { type: 'chunked', chunkSize: 1024 },
				},
			},
		});

		assert.equal(getDataStoreChunkSize(settings), 1024);
	});
});
