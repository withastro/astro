import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMarkdownProcessor, createShikiHighlighter } from '../dist/index.js';

describe('shiki syntax highlighting', () => {
	it('does not add is:raw to the output', async () => {
		const processor = await createMarkdownProcessor();
		const { code } = await processor.render('```\ntest\n```');

		assert.ok(!code.includes('is:raw'));
	});

	it('supports light/dark themes', async () => {
		const processor = await createMarkdownProcessor({
			shikiConfig: {
				experimentalThemes: {
					light: 'github-light',
					dark: 'github-dark',
				},
			},
		});
		const { code } = await processor.render('```\ntest\n```');

		// light theme is there:
		assert.match(code, /background-color:/);
		assert.match(code, /github-light/);

		// dark theme is there:
		assert.match(code, /--shiki-dark-bg:/);
		assert.match(code, /github-dark/);
	});

	it('createShikiHighlighter works', async () => {
		const highlighter = await createShikiHighlighter();

		const html = highlighter.highlight('const foo = "bar";', 'js');

		assert.match(html, /astro-code github-dark/);
		assert.match(html, /background-color:#24292e;color:#e1e4e8;/);
	});

	it('diff +/- text has user-select: none', async () => {
		const highlighter = await createShikiHighlighter();

		const html = highlighter.highlight(
			`\
- const foo = "bar";
+ const foo = "world";`,
			'diff'
		);

		assert.match(html, /user-select: none/);
		assert.match(html, />-<\/span>/);
		assert.match(html, />+<\/span>/);
	});
});
