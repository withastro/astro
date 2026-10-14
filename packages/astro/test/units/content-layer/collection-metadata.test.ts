import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRenderEntry } from '../../../dist/content/runtime.js';
import { defaultLogger } from '../test-utils.ts';

describe('render()', () => {
	it('rejects the entries returned by getCollectionMetadata()', async () => {
		const render = createRenderEntry({ logger: defaultLogger });
		const entry = { id: 'hello', collection: 'posts', data: {} };
		// The marker that getCollectionMetadata() adds to its entries
		Object.defineProperty(entry, Symbol.for('astro:content-metadata-entry'), { value: true });

		await assert.rejects(render(entry), {
			name: 'RenderMetadataEntryError',
			message: /`hello` of the collection `posts`/,
		});
		await assert.doesNotReject(render({ ...entry, rendered: { html: '<p>Hello</p>' } }));
	});
});
