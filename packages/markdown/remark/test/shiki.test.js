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
				themes: {
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

		const html = await highlighter.highlight('const foo = "bar";', 'js');

		assert.match(html, /astro-code github-dark/);
		assert.match(html, /background-color:#24292e;color:#e1e4e8;/);
	});

	it('diff +/- text has user-select: none', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.highlight(
			`\
- const foo = "bar";
+ const foo = "world";`,
			'diff',
		);

		assert.match(html, /user-select: none/);
		assert.match(html, />-<\/span>/);
		assert.match(html, />+<\/span>/);
	});

	it('renders attributes', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.highlight(`foo`, 'js', {
			attributes: { 'data-foo': 'bar', autofocus: true },
		});

		assert.match(html, /data-foo="bar"/);
		assert.match(html, /autofocus(?!=)/);
	});

	it('supports transformers that reads meta', async () => {
		const highlighter = await createShikiHighlighter({
			transformers: [
				{
					pre(node) {
						const meta = this.options.meta?.__raw;
						if (meta) {
							node.properties['data-test'] = meta;
						}
					},
				},
			],
		});

		const html = await highlighter.highlight(`foo`, 'js', {
			meta: '{1,3-4}',
		});

		assert.match(html, /data-test="\{1,3-4\}"/);
	});

	it('supports the defaultColor setting', async () => {
		const processor = await createMarkdownProcessor({
			shikiConfig: {
				themes: {
					light: 'github-light',
					dark: 'github-dark',
				},
				defaultColor: false,
			},
		});
		const { code } = await processor.render('```\ntest\n```');

		// Doesn't have `color` or `background-color` properties.
		assert.doesNotMatch(code, /color:/);
	});

	it('the highlighter supports lang alias', async () => {
		const highlighter = await createShikiHighlighter({
			langAlias: {
				cjs: 'javascript',
			},
		});

		const html = await highlighter.highlight(`let test = "some string"`, 'cjs', {
			attributes: { 'data-foo': 'bar', autofocus: true },
		});

		assert.match(html, /data-language="cjs"/);
	});

	it('the markdown processsor support lang alias', async () => {
		const processor = await createMarkdownProcessor({
			shikiConfig: {
				langAlias: {
					cjs: 'javascript',
				},
			},
		});

		const { code } = await processor.render('```cjs\nlet foo = "bar"\n```');

		assert.match(code, /data-language="cjs"/);
	});
});
