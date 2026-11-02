import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { createMarkdownProcessor, type MarkdownRenderer } from '../dist/index.js';

describe('heading ids', async () => {
	let processor: MarkdownRenderer;

	before(async () => {
		processor = await createMarkdownProcessor();
	});

	it('keeps curly braces in the heading text', async () => {
		const { code, metadata } = await processor.render('## Using {braces} in config');

		assert.equal(code, '<h2 id="using-braces-in-config">Using {braces} in config</h2>');
		assert.deepEqual(metadata.headings, [
			{ depth: 2, slug: 'using-braces-in-config', text: 'Using {braces} in config' },
		]);
	});

	it('keeps curly braces in inline code in the heading text', async () => {
		const { metadata } = await processor.render('## Code `{a}` inline');

		assert.deepEqual(metadata.headings, [
			{ depth: 2, slug: 'code-a-inline', text: 'Code {a} inline' },
		]);
	});

	it('collects the text of nested elements', async () => {
		const { metadata } = await processor.render('# Hello *{wide}* world');

		assert.deepEqual(metadata.headings, [
			{ depth: 1, slug: 'hello-wide-world', text: 'Hello {wide} world' },
		]);
	});
});
