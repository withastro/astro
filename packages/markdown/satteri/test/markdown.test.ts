import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSatteriMarkdownProcessor } from '../dist/index.js';

describe('satteri markdown', () => {
	it('renders basic markdown', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('# Title\n\nSome **bold** text.');
		assert.match(code, /<h1 id="title">Title<\/h1>/);
		assert.match(code, /<strong>bold<\/strong>/);
	});

	it('collects headings into metadata', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { metadata } = await processor.render(
			'# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six',
		);
		assert.deepEqual(metadata.headings, [
			{ depth: 1, slug: 'one', text: 'One' },
			{ depth: 2, slug: 'two', text: 'Two' },
			{ depth: 3, slug: 'three', text: 'Three' },
			{ depth: 4, slug: 'four', text: 'Four' },
			{ depth: 5, slug: 'five', text: 'Five' },
			{ depth: 6, slug: 'six', text: 'Six' },
		]);
	});

	it('applies GFM by default', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('Visit https://example.com today');
		assert.match(code, /<a href="https:\/\/example\.com"/);
	});

	it('disables GFM when `gfm: false`', async () => {
		const processor = await createSatteriMarkdownProcessor({ gfm: false });
		const { code } = await processor.render('Visit https://example.com today');
		assert.ok(!code.includes('<a '));
	});

	it('applies smart punctuation by default', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('He said "hello"');
		assert.match(code, /“hello”/);
	});

	it('disables smart punctuation when `smartypants: false`', async () => {
		const processor = await createSatteriMarkdownProcessor({ smartypants: false });
		const { code } = await processor.render('He said "hello"');
		assert.ok(code.includes('"hello"'));
	});

	it('collects local image paths into metadata', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { metadata } = await processor.render('![alt](./local.png)');
		assert.deepEqual(metadata.localImagePaths, ['./local.png']);
	});
});
