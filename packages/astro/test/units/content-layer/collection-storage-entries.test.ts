import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deserializeEntry, serializeEntry } from '../../../dist/content/storage.js';

const entry = {
	id: 'intro',
	data: { title: 'Intro', published: new Date('2026-01-01') },
	filePath: 'src/docs/intro.md',
	digest: 'abc',
	body: '# Intro',
	rendered: { html: '<h1>Intro</h1>', metadata: { headings: [] } },
	assetImports: ['./cover.png'],
	imageImports: [['cover']],
};

describe('stored entries', () => {
	it('round trips every field of an entry', () => {
		assert.deepEqual(deserializeEntry(serializeEntry(entry)), entry);
	});

	it('keeps body and rendered out of the metadata', () => {
		const stored = serializeEntry(entry);

		assert.equal(stored.id, 'intro');
		assert.ok(!stored.metadata.includes('<h1>Intro</h1>'));
		assert.ok(!stored.metadata.includes('# Intro'));
		assert.ok(stored.content);
	});

	it('returns an entry without content when the stored entry has none', () => {
		const { content: _content, ...stored } = serializeEntry(entry);
		const read = deserializeEntry(stored);

		assert.equal(read.body, undefined);
		assert.equal(read.rendered, undefined);
		assert.deepEqual(read.data, entry.data);
	});

	it('omits content for entries without body and rendered', () => {
		const stored = serializeEntry({ id: 'alice', data: { name: 'Alice' } });

		assert.equal(stored.content, undefined);
	});
});
