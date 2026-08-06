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

	it('highlights using prism', async () => {
		const processor = await createSatteriMarkdownProcessor({
			syntaxHighlight: { type: 'prism' },
		});
		const { code } = await processor.render('```js\nconsole.log("Hello, world!");\n```');
		assert.match(code, /<pre class="language-js" data-language="js">/);
		assert.match(code, /class="token /);
	});

	it('supports prism excludeLangs', async () => {
		const processor = await createSatteriMarkdownProcessor({
			syntaxHighlight: { type: 'prism', excludeLangs: ['js'] },
		});
		const { code } = await processor.render('```js\nconsole.log("Hello, world!");\n```');
		assert.ok(!code.includes('class="token '));
	});
});
