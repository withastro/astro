import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defineCollection } from '../../../dist/content/config.js';

describe('source-backed collection config', () => {
	it('marks adapter-backed collections as content sources', () => {
		const collection = defineCollection({ source: 'adapter' });

		assert.deepEqual(collection, {
			source: 'adapter',
			type: 'content_source',
		});
	});
});
