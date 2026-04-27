import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderErrorMarkdown } from '../../../dist/core/errors/dev/utils.js';

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
