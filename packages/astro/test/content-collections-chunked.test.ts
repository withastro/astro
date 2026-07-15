import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as devalue from 'devalue';
import { type Fixture, loadFixture } from './test-utils.ts';

// End-to-end coverage for the experimental chunked data store. Building the
// fixture exercises the full pipeline: the ChunkedWriter serializes the store to
// content-addressed parts, the content virtual module emits them as lazy `?raw`
// imports, and `getCollection` reassembles them at runtime via `manifestToMap`.
describe('Content Collections (chunked data store)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collections/',
			outDir: './dist/content-collections-chunked/',
			experimental: { collectionStorage: 'chunked' },
		});
		await fixture.build({ force: true });
	});

	it('reads a collection through the chunked virtual module', async () => {
		const json = devalue.parse(await fixture.readFile('/collections.json')) as {
			withSchemaConfig: Array<{ id: string; data: { publishedAt: Date } }>;
		};

		assert.equal(Array.isArray(json.withSchemaConfig), true);
		const ids = json.withSchemaConfig.map((item) => item.id);
		assert.deepEqual(ids.sort(), ['four%', 'one', 'three', 'two'].sort());
		// Dates survive devalue serialization through the chunked parts.
		assert.equal(
			json.withSchemaConfig.every((item) => item.data.publishedAt instanceof Date),
			true,
		);
	});
});
