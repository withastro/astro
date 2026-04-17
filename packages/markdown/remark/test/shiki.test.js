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

	it('lazy-loads built-in languages on first use', async () => {
		// Create a highlighter with no langs pre-registered — 'ts' is not loaded yet.
		const highlighter = await createShikiHighlighter();

		// Calling codeToHtml with 'ts' triggers lazy loading of the built-in grammar.
		const html = await highlighter.codeToHtml('const someTypeScript: number = 5;', 'ts');

		// Confirms the grammar loaded and tokenized — not a plain-text fallback.
		assert.match(html, /astro-code github-dark/);
		// Keyword color (const, number)
		assert.match(html, /color:#F97583/);
		// Type annotation / identifier color
		assert.match(html, /color:#79B8FF/);
		// Punctuation / default text color
		assert.match(html, /color:#E1E4E8/);
	});

	it('uses an integrated (named) theme', async () => {
		const highlighter = await createShikiHighlighter({ theme: 'github-light' });
		const html = await highlighter.codeToHtml('const foo = "bar";', 'js');

		assert.match(html, /astro-code github-light/);
		assert.match(html, /background-color:#fff;color:#24292e;/);
	});

	it('uses a custom (ThemeRegistrationRaw) theme', async () => {
		// Minimal subset of a custom theme — only the fields Shiki needs to
		// derive the pre element's background-color and color.
		const serendipityMorning = {
			name: 'Serendipity Morning',
			type: 'light',
			colors: {
				'editor.background': '#FDFDFE',
				'editor.foreground': '#4E5377',
			},
			tokenColors: [],
		};
		const highlighter = await createShikiHighlighter({ theme: serendipityMorning });
		const html = await highlighter.codeToHtml('const foo = "bar";', 'js');

		assert.match(html, /background-color:#FDFDFE;color:#4E5377;/);
	});

	it('falls back to plaintext for unknown languages', async () => {
		const highlighter = await createShikiHighlighter();
		// Should not throw; unknown lang is silently downgraded to plaintext.
		const html = await highlighter.codeToHtml('This language does not exist', 'unknown');

		assert.match(html, /astro-code/);
		assert.match(html, /background-color:#24292e;color:#e1e4e8;/);
	});

	it('highlights a custom language passed as a LanguageRegistration object', async () => {
		// Minimal rinfo grammar — same language used in the langs fixture.
		// Must be passed as a LanguageRegistration (name + scopeName at top level),
		// not the { id, grammar } wrapper used by Astro's config layer.
		const riLang = {
			name: 'rinfo',
			scopeName: 'source.rinfo',
			patterns: [{ include: '#lf-rinfo' }],
			repository: {
				'lf-rinfo': { patterns: [{ include: '#control' }] },
				control: {
					patterns: [
						{ name: 'keyword.control.ri', match: '\\b(si|mientras|repetir)\\b' },
						{ name: 'keyword.other.ri', match: '\\b(programa|comenzar|fin)\\b' },
					],
				},
			},
		};
		const highlighter = await createShikiHighlighter({ langs: [riLang] });
		const html = await highlighter.codeToHtml('programa Rinfo\ncomenzar\nfin', 'rinfo');

		// 'programa', 'comenzar', 'fin' are keyword.other.ri — should be tokenized, not plain text.
		assert.match(html, /data-language="rinfo"/);
		// The output must contain at least one coloured span (grammar was applied, not plaintext fallback).
		assert.match(html, /color:#F97583/);
	});

	it('wrap=true adds word-wrap styles', async () => {
		const highlighter = await createShikiHighlighter();
		const html = await highlighter.codeToHtml('const foo = "bar";', 'js', { wrap: true });

		assert.match(html, /white-space: pre-wrap/);
		assert.match(html, /word-wrap: break-word/);
		assert.match(html, /overflow-x: auto/);
	});

	it('wrap=false adds overflow-x auto but no word-wrap', async () => {
		const highlighter = await createShikiHighlighter();
		const html = await highlighter.codeToHtml('const foo = "bar";', 'js', { wrap: false });

		assert.match(html, /overflow-x: auto/);
		assert.doesNotMatch(html, /white-space: pre-wrap/);
		assert.doesNotMatch(html, /word-wrap: break-word/);
	});

	it('wrap=null removes all overflow styling', async () => {
		const highlighter = await createShikiHighlighter();
		const html = await highlighter.codeToHtml('const foo = "bar";', 'js', { wrap: null });

		assert.doesNotMatch(html, /overflow-x/);
		assert.doesNotMatch(html, /white-space: pre-wrap/);
		assert.doesNotMatch(html, /word-wrap: break-word/);
	});
});
