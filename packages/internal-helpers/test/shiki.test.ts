import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createShikiHighlighter } from '../dist/shiki.js';

describe('createShikiHighlighter', () => {
	it('does not mutate the provided langAlias object', async () => {
		const langAlias = {};
		const highlighter = await createShikiHighlighter({ langAlias });

		// Highlight a JavaScript code block, which causes Shiki to register
		// built-in aliases (js, cjs, mjs) for the "javascript" grammar.
		await highlighter.codeToHtml('const x = 1;', 'javascript', {});

		assert.deepStrictEqual(
			langAlias,
			{},
			'langAlias should not be mutated by Shiki language loading',
		);
	});
});
