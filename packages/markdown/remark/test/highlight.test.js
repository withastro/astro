import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMarkdownProcessor } from '../dist/index.js';

describe('highlight', () => {
	it('highlights using shiki by default', async () => {
		const processor = await createMarkdownProcessor();
		const { code } = await processor.render('```js\nconsole.log("Hello, world!");\n```');
		assert.match(code, /background-color:/);
	});

	it('does not highlight math code blocks by default', async () => {
		const processor = await createMarkdownProcessor();
		const { code } = await processor.render('```math\n\\frac{1}{2}\n```');

		assert.ok(!code.includes('background-color:'));
	});

	it('highlights using prism', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: {
				type: 'prism',
			},
		});
		const { code } = await processor.render('```js\nconsole.log("Hello, world!");\n```');
		assert.ok(code.includes('token'));
	});

	it('supports excludeLangs', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: {
				type: 'shiki',
				excludeLangs: ['mermaid'],
			},
		});
		const { code } = await processor.render('```mermaid\ngraph TD\nA --> B\n```');

		assert.ok(!code.includes('background-color:'));
	});

	it('supports excludeLangs with prism', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: {
				type: 'prism',
				excludeLangs: ['mermaid'],
			},
		});
		const { code } = await processor.render('```mermaid\ngraph TD\nA --> B\n```');

		assert.ok(!code.includes('token'));
	});
});
