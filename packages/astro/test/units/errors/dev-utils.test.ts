import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectErrorMetadata, renderErrorMarkdown } from '../../../dist/core/errors/dev/utils.js';

describe('renderErrorMarkdown', () => {
	describe('html target', () => {
		it('converts markdown links to HTML anchor tags', () => {
			const input = 'Check the [documentation](https://docs.astro.build)';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(
				result,
				'Check the <a href="https://docs.astro.build" target="_blank">documentation</a>',
			);
		});

		it('converts bold text to HTML b tags', () => {
			const input = 'This is **important** text';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(result, 'This is <b>important</b> text');
		});

		it('converts inline code to HTML code tags', () => {
			const input = 'Use the `console.log` function';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(result, 'Use the <code>console.log</code> function');
		});

		it('converts bare URLs to HTML anchor tags', () => {
			const input = 'Visit https://astro.build for more info';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(
				result,
				'Visit <a href="https://astro.build" target="_blank">https://astro.build</a> for more info',
			);
		});

		it('escapes HTML entities in the input', () => {
			const input = 'Use <script> tags carefully';
			const result = renderErrorMarkdown(input, 'html');
			assert.ok(result.includes('&lt;script&gt;'));
		});

		it('handles multiple markdown elements', () => {
			const input = 'Check **bold** and `code` and [link](https://example.com)';
			const result = renderErrorMarkdown(input, 'html');
			assert.ok(result.includes('<b>bold</b>'));
			assert.ok(result.includes('<code>code</code>'));
			assert.ok(result.includes('<a href="https://example.com" target="_blank">link</a>'));
		});

		it('handles link with parentheses followed by more content', () => {
			// This is the bug case from issue #15068
			// The link [text](url) should not consume content after it
			const input = 'use [text](https://example.com) for links';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(result, 'use <a href="https://example.com" target="_blank">text</a> for links');
		});

		it('handles link followed by closing parenthesis', () => {
			// Edge case: link inside parentheses like "(use [text](url))"
			const input = '(use [text](https://example.com))';
			const result = renderErrorMarkdown(input, 'html');
			// The link should only capture the URL, not the closing paren
			assert.equal(result, '(use <a href="https://example.com" target="_blank">text</a>)');
		});

		it('handles escaped HTML followed by link syntax', () => {
			// This simulates the MDX error message case
			const input = 'use <code>[text](https://example.com)</code>';
			const result = renderErrorMarkdown(input, 'html');
			// After HTML escaping, <code> becomes &lt;code&gt;
			// The link should still be parsed correctly without consuming &gt;)
			assert.ok(result.includes('<a href="https://example.com" target="_blank">text</a>'));
			assert.ok(result.includes('&lt;code&gt;'));
			assert.ok(result.includes('&lt;/code&gt;'));
		});

		it('handles multiple links in the same message', () => {
			const input = 'See [docs](https://docs.astro.build) and [guide](https://guide.astro.build)';
			const result = renderErrorMarkdown(input, 'html');
			assert.ok(result.includes('<a href="https://docs.astro.build" target="_blank">docs</a>'));
			assert.ok(result.includes('<a href="https://guide.astro.build" target="_blank">guide</a>'));
		});
	});

	describe('only allows proper links in the dev overlay', () => {
		it('blocks javascript: URLs in links', () => {
			const input = '[click me](javascript:alert(1))';
			const result = renderErrorMarkdown(input, 'html');
			// Should not create a link
			assert.ok(!result.includes('<a'));
			assert.ok(!result.includes('javascript:'));
			// Should contain the link text
			assert.ok(result.includes('click me'));
		});

		it('blocks data: URLs in links', () => {
			const input = '[click me](data:text/html,<script>alert(1)</script>)';
			const result = renderErrorMarkdown(input, 'html');
			// Should not create a link
			assert.ok(!result.includes('<a'));
			assert.ok(!result.includes('data:'));
			// Should contain the link text
			assert.ok(result.includes('click me'));
		});

		it('blocks file: URLs in links', () => {
			const input = '[click me](file:///etc/passwd)';
			const result = renderErrorMarkdown(input, 'html');
			// Should render as plain text, not a link
			assert.equal(result, 'click me');
			assert.ok(!result.includes('file:'));
			assert.ok(!result.includes('<a'));
		});

		it('blocks relative URLs in links', () => {
			const input = '[home](/index.html)';
			const result = renderErrorMarkdown(input, 'html');
			// Should render as plain text, not a link
			assert.equal(result, 'home');
			assert.ok(!result.includes('/index.html'));
			assert.ok(!result.includes('<a'));
		});

		it('blocks malformed URLs in links', () => {
			const input = '[click me](not-a-valid-url)';
			const result = renderErrorMarkdown(input, 'html');
			// Should render as plain text, not a link
			assert.equal(result, 'click me');
			assert.ok(!result.includes('<a'));
		});

		it('allows http: URLs in links', () => {
			const input = '[example](http://example.com)';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(result, '<a href="http://example.com" target="_blank">example</a>');
		});

		it('allows https: URLs in links', () => {
			const input = '[example](https://example.com)';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(result, '<a href="https://example.com" target="_blank">example</a>');
		});

		it('handles mixed safe and unsafe links', () => {
			const input = '[safe](https://example.com) and [unsafe](javascript:alert(1))';
			const result = renderErrorMarkdown(input, 'html');
			assert.ok(result.includes('<a href="https://example.com" target="_blank">safe</a>'));
			assert.ok(result.includes('unsafe'));
			assert.ok(!result.includes('javascript:'));
		});

		it('blocks case-insensitive javascript: URLs', () => {
			const input = '[click me](JavaScript:alert(1))';
			const result = renderErrorMarkdown(input, 'html');
			// Should not create a link
			assert.ok(!result.includes('<a'));
			assert.ok(!result.includes('JavaScript:'));
			// Should contain the link text
			assert.ok(result.includes('click me'));
		});
	});

	describe('cli target', () => {
		it('formats markdown links for CLI output', () => {
			const input = 'Check the [documentation](https://docs.astro.build)';
			const result = renderErrorMarkdown(input, 'cli');
			// CLI output should contain the link text and URL
			assert.ok(result.includes('documentation'));
			assert.ok(result.includes('https://docs.astro.build'));
		});

		it('formats bold text for CLI output', () => {
			const input = 'This is **important** text';
			const result = renderErrorMarkdown(input, 'cli');
			assert.ok(result.includes('important'));
		});

		it('formats bare URLs for CLI output', () => {
			const input = 'Visit https://astro.build for more info';
			const result = renderErrorMarkdown(input, 'cli');
			assert.ok(result.includes('https://astro.build'));
		});
	});

	describe('only allows proper links in the terminal', () => {
		it('blocks javascript: URLs in links', () => {
			const input = '[click me](javascript:alert(1))';
			const result = renderErrorMarkdown(input, 'cli');
			// Should render with plain text, URL shown but not styled
			assert.ok(result.includes('click me'));
			assert.ok(result.includes('javascript:alert(1)'));
		});

		it('blocks data: URLs in links', () => {
			const input = '[click me](data:text/html,<script>alert(1)</script>)';
			const result = renderErrorMarkdown(input, 'cli');
			assert.ok(result.includes('click me'));
			assert.ok(result.includes('data:text/html'));
		});

		it('blocks relative URLs in links', () => {
			const input = '[home](/index.html)';
			const result = renderErrorMarkdown(input, 'cli');
			assert.ok(result.includes('home'));
			assert.ok(result.includes('/index.html'));
		});

		it('allows safe URLs in links', () => {
			const input = '[docs](https://docs.astro.build)';
			const result = renderErrorMarkdown(input, 'cli');
			assert.ok(result.includes('docs'));
			assert.ok(result.includes('https://docs.astro.build'));
		});

		it('handles mixed safe and unsafe links', () => {
			const input = '[safe](https://example.com) and [unsafe](javascript:alert(1))';
			const result = renderErrorMarkdown(input, 'cli');
			assert.ok(result.includes('https://example.com'));
			assert.ok(result.includes('unsafe'));
			assert.ok(result.includes('javascript:alert(1)'));
		});
	});
});

describe('collectErrorMetadata', () => {
	it('uses sub-error properties when the parent error has an errors array', () => {
		// Simulate how rolldown/Vite wraps a plugin error: the parent error has
		// its own stack but no loc/plugin, while the sub-error carries the real info.
		const subError = new Error('Something went wrong in component.astro');
		subError.stack = `Error: Something went wrong in component.astro
    at renderComponent (file:///project/src/components/Foo.astro:10:5)`;

		const parentError = new Error('Build failed with 1 error');
		parentError.stack = `Error: Build failed with 1 error
    at buildEnvironment (file:///node_modules/vite/dist/node/chunks/node.js:33011:66)`;
		// @ts-ignore - adding errors array like rolldown does
		parentError.errors = [subError];

		const result = collectErrorMetadata(parentError);

		// The sub-error's own stack should be used, not the parent's
		assert.ok(result.stack?.includes('renderComponent'));
		assert.ok(!result.stack?.includes('buildEnvironment'));
	});

	it('preserves sub-error loc when parent error has no loc', () => {
		const subError = new Error('Parse error');
		// @ts-ignore
		subError.loc = { file: '/project/src/pages/test.mdx', line: 10, column: 5 };
		// @ts-ignore
		subError.plugin = 'astro:mdx';
		subError.stack = `Error: Parse error
    at transform (file:///project/node_modules/@astrojs/mdx/dist/index.js:42:7)`;

		const parentError = new Error('Build failed');
		parentError.stack = `Error: Build failed
    at buildEnvironment (file:///node_modules/vite/dist/node.js:100:20)`;
		// @ts-ignore
		parentError.errors = [subError];

		const result = collectErrorMetadata(parentError);

		assert.equal(result.loc?.file, '/project/src/pages/test.mdx');
		assert.equal(result.loc?.line, 10);
		assert.equal(result.loc?.column, 5);
		assert.equal(result.plugin, 'astro:mdx');
	});

	it('does not generate misleading hints from parent error message', () => {
		// The sub-error message has no browser API references, but the parent's
		// stack/message might mention "window" or "document" incidentally.
		const subError = new Error('Could not parse expression with oxc');
		subError.stack = `Error: Could not parse expression with oxc
    at transform (file:///project/node_modules/@astrojs/mdx/dist/index.js:42:7)`;

		const parentError = new Error('Build failed - check document for details');
		parentError.stack = `Error: Build failed
    at build (file:///node_modules/vite/dist/node.js:100:20)`;
		// @ts-ignore
		parentError.errors = [subError];

		const result = collectErrorMetadata(parentError);

		// Should not get a "Browser APIs are not available" hint from the parent message
		assert.ok(
			!result.hint?.includes('Browser APIs'),
			'Should not generate browser API hint from parent error',
		);
	});
});
