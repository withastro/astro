import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSatteriMarkdownProcessor } from '../dist/index.js';

describe('satteri highlight', () => {
	it('highlights using shiki by default', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('```js\nconsole.log("Hello, world!");\n```');
		assert.match(code, /background-color:/);
	});

	it('does not highlight math code blocks by default', async () => {
		const processor = await createSatteriMarkdownProcessor();
		const { code } = await processor.render('```math\n\\frac{1}{2}\n```');
		assert.ok(!code.includes('background-color:'));
	});

	it('supports excludeLangs', async () => {
		const processor = await createSatteriMarkdownProcessor({
			syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
		});
		const { code } = await processor.render('```mermaid\ngraph TD\nA --> B\n```');
		assert.ok(!code.includes('background-color:'));
	});

	it('rejects prism highlighting', async () => {
		await assert.rejects(
			createSatteriMarkdownProcessor({ syntaxHighlight: { type: 'prism' } }),
			/Prism syntax highlighting is not supported/,
		);
	});
});
