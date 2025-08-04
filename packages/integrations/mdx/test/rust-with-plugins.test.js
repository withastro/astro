import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rehypeHeadingIds, remarkCollectImages } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import { VFile } from 'vfile';
import { createRustProcessor } from '../dist/processors/rust.js';
import { rehypeInjectHeadingsExport } from '../dist/rehype-collect-headings.js';

describe('Rust Compiler with Plugins', () => {
	it('should apply remark plugins correctly', async () => {
		const processor = await createRustProcessor({
			remarkPlugins: [remarkGfm, remarkCollectImages],
		});

		const mdxContent = `
# Hello World

This is a **test** with GFM features:

- [ ] Task list item
- [x] Completed task

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

![Test Image](/test.png)
`;

		const result = await processor.process(mdxContent);

		// Check that we got JavaScript output
		assert.ok(result.value.includes('function') || result.value.includes('export'));
		assert.ok(result.value.includes('MDXContent') || result.value.includes('default'));

		// Check that data structure is correct
		assert.ok(result.data);
		assert.ok(result.data.astro);
	});

	it('should collect metadata from mdast', async () => {
		const processor = await createRustProcessor({
			remarkPlugins: [],
		});

		const mdxContent = `# Heading 1

## Heading 2

![Local Image](/local.png)
![Remote Image](https://example.com/remote.png)

Some content here.
`;

		const vfile = new VFile({ value: mdxContent });
		const result = await processor.process(vfile);

		// Check headings were collected
		assert.ok(result.data.astro);
		assert.equal(result.data.astro.headings.length, 2);
		assert.equal(result.data.astro.headings[0].text, 'Heading 1');
		assert.equal(result.data.astro.headings[0].depth, 1);
		assert.equal(result.data.astro.headings[1].text, 'Heading 2');
		assert.equal(result.data.astro.headings[1].depth, 2);

		// Check images were collected
		assert.equal(result.data.astro.localImagePaths.length, 1);
		assert.equal(result.data.astro.localImagePaths[0], '/local.png');
		assert.equal(result.data.astro.remoteImagePaths.length, 1);
		assert.equal(result.data.astro.remoteImagePaths[0], 'https://example.com/remote.png');
	});

	it('should support rehype plugins', async () => {
		const processor = await createRustProcessor({
			remarkPlugins: [],
			rehypePlugins: [[rehypeHeadingIds, { experimentalHeadingIdCompat: false }], rehypeInjectHeadingsExport],
		});

		const mdxContent = `# Test Heading

Some content here.
`;

		const vfile = new VFile({ value: mdxContent });
		const result = await processor.process(vfile);

		// Check that headings were processed
		assert.ok(result.data.astro);
		assert.ok(result.data.astro.headings);
		assert.equal(result.data.astro.headings.length, 1);
		
		// The generated code should have getHeadings export
		assert.ok(result.value.includes('function') || result.value.includes('export'));
	});

	it('should work without plugins', async () => {
		const processor = await createRustProcessor({
			remarkPlugins: [],
		});

		const mdxContent = `# Simple Test\n\nJust a paragraph.`;
		const result = await processor.process(mdxContent);

		assert.ok(result.value.includes('function') || result.value.includes('export'));
		assert.ok(result.value.includes('MDXContent') || result.value.includes('default'));
	});
});
