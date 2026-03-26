import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import MagicString from 'magic-string';
import { rehype } from 'rehype';
import { VFile } from 'vfile';
import rehypeSlots, { SLOT_PREFIX } from '../../../dist/vite-plugin-html/transform/slots.js';

describe('vite-plugin-html: slot transformer', () => {
	async function testSlotTransform(html) {
		const s = new MagicString(html);
		const processor = rehype().data('settings', { fragment: true }).use(rehypeSlots, { s });

		const vfile = new VFile({ value: html, path: 'test.html' });
		await processor.process(vfile);
		return s.toString();
	}

	it('transforms default slots', async () => {
		const result = await testSlotTransform('<slot>Default content</slot>');
		assert.equal(result, `\${${SLOT_PREFIX}["default"] ?? \`Default content\`}`);
	});

	it('transforms named slots', async () => {
		const result = await testSlotTransform('<slot name="header">Header content</slot>');
		assert.equal(result, `\${${SLOT_PREFIX}["header"] ?? \`Header content\`}`);
	});

	it('transforms multiple named slots', async () => {
		const html = `<div id="a"><slot name="a"></slot></div>
<div id="b"><slot name="b"></slot></div>
<div id="c"><slot name="c"></slot></div>`;

		const result = await testSlotTransform(html);
		// Slots extract their inner HTML including the slot tag itself when empty
		assert.match(
			result,
			new RegExp(
				`<div id="a">\\$\\{${SLOT_PREFIX}\\["a"\\] \\?\\? \`<slot name="a"></slot>\`\\}</div>`,
			),
		);
		assert.match(
			result,
			new RegExp(
				`<div id="b">\\$\\{${SLOT_PREFIX}\\["b"\\] \\?\\? \`<slot name="b"></slot>\`\\}</div>`,
			),
		);
		assert.match(
			result,
			new RegExp(
				`<div id="c">\\$\\{${SLOT_PREFIX}\\["c"\\] \\?\\? \`<slot name="c"></slot>\`\\}</div>`,
			),
		);
	});

	it('preserves inline slots', async () => {
		const result = await testSlotTransform('<slot is:inline></slot>');
		assert.equal(result, '<slot is:inline></slot>');
	});

	it('preserves inline slots with name', async () => {
		const result = await testSlotTransform('<slot name="test" is:inline>Content</slot>');
		assert.equal(result, '<slot name="test" is:inline>Content</slot>');
	});

	it('escapes template literal characters in slot content', async () => {
		const result = await testSlotTransform('<slot>Content with ${variable} and `backticks`</slot>');
		assert.equal(
			result,
			`\${${SLOT_PREFIX}["default"] ?? \`Content with \\$\{variable\} and \\\`backticks\\\`\`}`,
		);
	});

	it('handles slots with multiple children', async () => {
		const html = '<slot><span>Child 1</span><span>Child 2</span></slot>';
		const result = await testSlotTransform(html);
		assert.equal(
			result,
			`\${${SLOT_PREFIX}["default"] ?? \`<span>Child 1</span><span>Child 2</span>\`}`,
		);
	});

	it('trims slot content', async () => {
		const html = '<slot>\n  Content with whitespace  \n</slot>';
		const result = await testSlotTransform(html);
		assert.equal(result, `\${${SLOT_PREFIX}["default"] ?? \`Content with whitespace\`}`);
	});

	it('handles empty slots', async () => {
		const result = await testSlotTransform('<slot></slot>');
		// Empty slots still include the slot tag itself in the fallback
		assert.equal(result, `\${${SLOT_PREFIX}["default"] ?? \`<slot></slot>\`}`);
	});

	it('handles empty named slots', async () => {
		const result = await testSlotTransform('<slot name="empty"></slot>');
		// Empty slots include the slot tag itself
		assert.equal(result, `\${${SLOT_PREFIX}["empty"] ?? \`<slot name="empty"></slot>\`}`);
	});

	it('preserves non-slot elements', async () => {
		const html = '<div>Not a slot</div>';
		const result = await testSlotTransform(html);
		assert.equal(result, html);
	});

	it('transforms mixed content correctly', async () => {
		const html = `<div>
	<slot name="header">Default Header</slot>
	<p>Static content</p>
	<slot>Default body</slot>
</div>`;

		const result = await testSlotTransform(html);
		assert.match(result, /<div>\s*\n/);
		assert.match(
			result,
			new RegExp(`\\$\\{${SLOT_PREFIX}\\["header"\\] \\?\\? \`Default Header\`\\}`),
		);
		assert.match(result, /<p>Static content<\/p>/);
		assert.match(
			result,
			new RegExp(`\\$\\{${SLOT_PREFIX}\\["default"\\] \\?\\? \`Default body\`\\}`),
		);
		assert.match(result, /\n<\/div>$/);
	});

	it('handles complex slot content with special characters', async () => {
		const html = '<slot>Complex: ${foo} \\ `bar` \\${baz}</slot>';
		const result = await testSlotTransform(html);
		// The content should be escaped when transformed
		assert.equal(
			result,
			`\${${SLOT_PREFIX}["default"] ?? \`Complex: \\$\{foo\} \\\\ \\\`bar\\\` \\\\\\$\{baz\}\`}`,
		);
	});
});
