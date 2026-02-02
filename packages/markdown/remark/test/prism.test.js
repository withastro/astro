import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMarkdownProcessor } from '../dist/index.js';

describe('prism syntax highlighting', () => {
	it('does not add is:raw to the output', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: 'prism',
		});
		const { code } = await processor.render('```js\nconst foo = "bar";\n```');

		assert.ok(!code.includes('is:raw'), 'is:raw should not appear in the HTML output');
	});
});
