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
			const input = 'use [text](url) for links';
			const result = renderErrorMarkdown(input, 'html');
			assert.equal(result, 'use <a href="url" target="_blank">text</a> for links');
		});

		it('handles link followed by closing parenthesis', () => {
			// Edge case: link inside parentheses like "(use [text](url))"
			const input = '(use [text](url))';
			const result = renderErrorMarkdown(input, 'html');
			// The link should only capture 'url', not 'url)'
			assert.equal(result, '(use <a href="url" target="_blank">text</a>)');
		});

		it('handles escaped HTML followed by link syntax', () => {
			// This simulates the MDX error message case
			const input = 'use <code>[text](url)</code>';
			const result = renderErrorMarkdown(input, 'html');
			// After HTML escaping, <code> becomes &lt;code&gt;
			// The link should still be parsed correctly without consuming &gt;)
			assert.ok(result.includes('<a href="url" target="_blank">text</a>'));
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
});
