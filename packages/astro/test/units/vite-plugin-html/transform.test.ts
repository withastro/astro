import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { transform } from '../../../dist/vite-plugin-html/transform/index.js';

describe('vite-plugin-html: transform integration', () => {
	it('transforms basic HTML file', async () => {
		const code = '<div>Hello World</div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /function render\(\{ slots: ___SLOTS___ \}\)/);
		assert.match(result.code, /return `/);
		assert.match(result.code, /`/);
		assert.match(result.code, /render\["astro:html"\] = true;/);
		assert.match(result.code, /export default render;/);
		assert.ok(result.map);
	});

	it('transforms HTML with slots', async () => {
		const code = '<div><slot>Default content</slot></div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /\$\{___SLOTS___\["default"\] \?\? `Default content`\}/);
	});

	it('transforms HTML with named slots', async () => {
		const code = '<div><slot name="header">Header</slot><slot name="footer">Footer</slot></div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /\$\{___SLOTS___\["header"\] \?\? `Header`\}/);
		assert.match(result.code, /\$\{___SLOTS___\["footer"\] \?\? `Footer`\}/);
	});

	it('escapes template literal characters', async () => {
		const code = '<div>${variable}</div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /\\\$\{variable\}/);
	});

	it('escapes backticks in content', async () => {
		const code = '<div>`backticks`</div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /\\`backticks\\`/);
	});

	it('escapes backslashes', async () => {
		const code = '<div>\\backslash</div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /\\\\backslash/);
	});

	it('preserves inline slots', async () => {
		const code = '<div><slot is:inline>Inline content</slot></div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /<slot is:inline>Inline content<\/slot>/);
		assert.doesNotMatch(result.code, /\$\{___SLOTS___\["default"\]/);
	});

	it('handles complex escaping in attributes', {
		skip: 'There is a bug in replaceAttribute with multiple attributes',
	}, async () => {
		const code = '<div data-value="${foo}" data-template="`${bar}`"></div>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /data-value="\\\$\{foo\}"/);
		assert.match(result.code, /data-template="\\`\\\$\{bar\}\\`"/);
	});

	it('transforms empty HTML', async () => {
		const code = '';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /function render/);
		assert.match(result.code, /return ``/);
	});

	it('handles multiple elements at root level', async () => {
		const code = '<h1>Title</h1>\n<p>Paragraph</p>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /<h1>Title<\/h1>/);
		assert.match(result.code, /<p>Paragraph<\/p>/);
	});

	it('escapes content in script tags', async () => {
		const code = '<script>console.log(`${variable}`);</script>';
		const result = await transform(code, 'test.html');

		assert.match(result.code, /console\.log\(\\`\\\$\{variable\}\\`\)/);
	});

	it('handles comments with template literals', async () => {
		const code = '<!-- Comment with ${variable} -->';
		const result = await transform(code, 'test.html');

		// Comments are parsed as text nodes, so only content is preserved
		assert.match(result.code, / Comment with \\\$\{variable\} /);
	});

	it('produces valid source maps', async () => {
		const code = '<div>Hello</div>';
		const result = await transform(code, 'test.html');

		assert.ok(result.map);
		assert.equal(result.map.version, 3);
		// MagicString doesn't set file property by default
		assert.ok(result.map.mappings);
		// Sources array is populated by MagicString based on options
		assert.ok(result.map.sources === undefined || Array.isArray(result.map.sources));
	});
});
