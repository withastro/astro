import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createMarkdownProcessor,
	createShikiHighlighter,
	globalShikiStyleCollector,
} from '../dist/index.js';

describe('shiki syntax highlighting', () => {
	it('does not add is:raw to the output', async () => {
		const processor = await createMarkdownProcessor();
		const { code } = await processor.render('```\ntest\n```');

		assert.ok(!code.includes('is:raw'));
	});

	it('supports light/dark themes', async () => {
		// Clear the style collector before testing
		globalShikiStyleCollector.clear();

		const processor = await createMarkdownProcessor({
			shikiConfig: {
				themes: {
					light: 'github-light',
					dark: 'github-dark',
				},
			},
		});
		const { code } = await processor.render('```\ntest\n```');

		// Both theme classes should be present in HTML
		assert.match(code, /github-light/);
		assert.match(code, /github-dark/);

		// Should have the astro-code-themes class (indicating dual theme mode)
		assert.match(code, /astro-code-themes/);

		// With class-based styles, no inline background-color on pre
		assert.doesNotMatch(code, /<pre[^>]*style="[^"]*background-color:/);

		// Check that the collected CSS contains dark theme CSS variables
		const css = globalShikiStyleCollector.collectCSS();
		assert.match(css, /--shiki-dark-bg:/);
		assert.match(css, /--shiki-dark:/);
	});

	it('createShikiHighlighter works', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.codeToHtml('const foo = "bar";', 'js');

		// Should have theme class
		assert.match(html, /astro-code/);
		assert.match(html, /github-dark/);

		// With class-based styles, should have __a_ classes instead of inline styles
		assert.match(html, /__a_[a-z0-9]+/);
		assert.match(html, /astro-code-overflow/);

		// Should NOT have inline background-color or color styles on pre
		assert.doesNotMatch(html, /<pre[^>]*style="[^"]*background-color:/);
		assert.doesNotMatch(html, /<pre[^>]*style="[^"]*color:/);
	});

	it('createShikiHighlighter works with codeToHast', async () => {
		const highlighter = await createShikiHighlighter();

		const hast = await highlighter.codeToHast('const foo = "bar";', 'js');

		// class is an array with class-based styles
		const classArray = hast.children[0].properties.class;
		assert.ok(Array.isArray(classArray), 'class should be an array');
		assert.ok(classArray.includes('astro-code'), 'should have astro-code class');
		assert.ok(classArray.includes('github-dark'), 'should have theme class');
		assert.ok(
			classArray.some((c) => c.startsWith('__a_')),
			'should have token style class',
		);
		assert.ok(classArray.includes('astro-code-overflow'), 'should have overflow class');

		// With class-based styles, style property should be undefined (no inline styles)
		assert.ok(!hast.children[0].properties.style, 'should have no inline style');
	});

	it('diff +/- text has user-select: none', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.codeToHtml(
			`\
- const foo = "bar";
+ const foo = "world";`,
			'diff',
		);

		// With class-based styles, user-select should be a class, not inline style
		assert.match(html, /astro-code-no-select/);
		assert.match(html, />-<\/span>/);
		assert.match(html, />+<\/span>/);

		// Should NOT have inline user-select style
		assert.doesNotMatch(html, /style="[^"]*user-select:/);
	});

	it('renders attributes', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.codeToHtml(`foo`, 'js', {
			attributes: { 'data-foo': 'bar', autofocus: true },
		});

		assert.match(html, /data-foo="bar"/);
		assert.match(html, /autofocus(?!=)/);
	});

	it('supports transformers that reads meta', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.codeToHtml(`foo`, 'js', {
			meta: '{1,3-4}',
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

		const html = await highlighter.codeToHtml(`let test = "some string"`, 'cjs', {
			attributes: { 'data-foo': 'bar', autofocus: true },
		});

		assert.match(html, /data-language="cjs"/);
	});

	it('the markdown processor support lang alias', async () => {
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
