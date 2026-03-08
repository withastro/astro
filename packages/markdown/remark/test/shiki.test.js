import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMarkdownProcessor, createShikiHighlighter } from '../dist/index.js';
import { clearShikiHighlighterCache } from '../dist/shiki.js';

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

		const html = await highlighter.codeToHtml('const foo = "bar";', 'js');

		assert.match(html, /astro-code github-dark/);
		assert.match(html, /background-color:#24292e;color:#e1e4e8;/);
	});

	it('createShikiHighlighter works with codeToHast', async () => {
		const highlighter = await createShikiHighlighter();

		const hast = await highlighter.codeToHast('const foo = "bar";', 'js');

		assert.match(hast.children[0].properties.class, /astro-code github-dark/);
		assert.match(hast.children[0].properties.style, /background-color:#24292e;color:#e1e4e8;/);
	});

	it('createShikiHighlighter can reuse the same instance for different languages', async () => {
		const langs = [
			'abap',
			'ada',
			'adoc',
			'angular-html',
			'angular-ts',
			'apache',
			'apex',
			'apl',
			'applescript',
			'ara',
			'asciidoc',
			'asm',
			'astro',
			'awk',
			'ballerina',
			'bash',
			'bat',
			'batch',
			'be',
			'beancount',
			'berry',
			'bibtex',
			'bicep',
			'blade',
			'bsl',
		];

		const highlighters = new Set();
		for (const lang of langs) {
			highlighters.add(await createShikiHighlighter({ langs: [lang] }));
		}

		// Ensure that we only have one highlighter instance.
		assert.strictEqual(highlighters.size, 1);

		// Ensure that this highlighter instance can highlight different languages.
		const highlighter = Array.from(highlighters)[0];
		const html1 = await highlighter.codeToHtml('const foo = "bar";', 'js');
		const html2 = await highlighter.codeToHtml('const foo = "bar";', 'ts');
		assert.match(html1, /color:#F97583/);
		assert.match(html2, /color:#F97583/);
	});

	it('diff +/- text has user-select: none', async () => {
		const highlighter = await createShikiHighlighter();

		const html = await highlighter.codeToHtml(
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

	it("the cached highlighter won't load the same language twice", async () => {
		clearShikiHighlighterCache();

		const theme = 'github-light';
		const highlighter = await createShikiHighlighter({ theme });

		// loadLanguage is an internal method
		const loadLanguageArgs = [];
		const originalLoadLanguage = highlighter['loadLanguage'];
		highlighter['loadLanguage'] = async (...args) => {
			loadLanguageArgs.push(...args);
			return await originalLoadLanguage(...args);
		};

		// No languages loaded yet
		assert.equal(loadLanguageArgs.length, 0);

		// Load a new language
		const h1 = await createShikiHighlighter({ theme, langs: ['js'] });
		assert.equal(loadLanguageArgs.length, 1);

		// Load the same language again
		const h2 = await createShikiHighlighter({ theme, langs: ['js'] });
		assert.equal(loadLanguageArgs.length, 1);

		// Load another language
		const h3 = await createShikiHighlighter({ theme, langs: ['ts'] });
		assert.equal(loadLanguageArgs.length, 2);

		// Load the same language again
		const h4 = await createShikiHighlighter({ theme, langs: ['ts'] });
		assert.equal(loadLanguageArgs.length, 2);

		// All highlighters should be the same instance
		assert.equal(new Set([highlighter, h1, h2, h3, h4]).size, 1);

		clearShikiHighlighterCache();
	});
});
