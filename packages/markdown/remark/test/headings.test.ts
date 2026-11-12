import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { createMarkdownProcessor, type MarkdownRenderer } from '../dist/index.js';

describe('headings', async () => {
	let processor: MarkdownRenderer;

	before(async () => {
		processor = await createMarkdownProcessor();
	});

	it('preserves curly braces in heading text', async () => {
		const { metadata } = await processor.render('## Using {braces} in config');

		assert.deepEqual(metadata.headings, [
			{ depth: 2, slug: 'using-braces-in-config', text: 'Using {braces} in config' },
		]);
	});
});
