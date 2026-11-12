import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMarkdownProcessor } from '../dist/index.js';

describe('prism syntax highlighting', () => {
	it('does not add is:raw to the output', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: 'prism',
		});
		const { code } = await processor.render('```\ntest\n```');

		assert.ok(!code.includes('is:raw'));
	});

	it('displays code for unsupported languages as text', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: 'prism',
		});
		const { code } = await processor.render('```vue\n<template><b>hi</b></template>\n```');

		assert.match(code, /<pre class="language-vue" data-language="vue">/);
		assert.ok(!code.includes('<template>'), code);
		assert.ok(!code.includes('<b>'), code);
	});

	it('escapes the language in the generated attributes', async () => {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: 'prism',
		});
		const { code } = await processor.render('```a"b\ntest\n```');

		assert.ok(!code.includes('class="language-a" b'), code);
		assert.match(code, /<pre class="language-a&#x22;b" data-language="a&#x22;b">/);
	});
});
