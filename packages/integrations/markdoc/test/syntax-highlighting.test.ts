import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Markdoc, { type Tag } from '@markdoc/markdoc';
import { isHTMLString } from 'astro/runtime/server/index.js';
import { parseHTML } from 'linkedom';
import prism from '../dist/extensions/prism.js';
import shiki from '../dist/extensions/shiki.js';
import { setupConfig } from '../dist/runtime.js';

const entry = `
\`\`\`ts
const highlighting = true;
\`\`\`

\`\`\`css
.highlighting {
	color: red;
}
\`\`\`
`;

describe('Markdoc - syntax highlighting', () => {
	describe('shiki', () => {
		it('transforms with defaults', async () => {
			const ast = Markdoc.parse(entry);
			// @ts-expect-error AstroMarkdocConfig is incompatible with Markdoc.Config
			const config: Markdoc.Config = await getConfigExtendingShiki();
			const content = (await Markdoc.transform(ast, config)) as Tag;

			assert.equal(content.children.length, 2);
			for (const codeBlock of content.children) {
				assert.equal(isHTMLString(codeBlock), true);

				const pre = parsePreTag(codeBlock as string);
				assert.equal(pre.classList.contains('astro-code'), true);
				assert.equal(pre.classList.contains('github-dark'), true);
			}
		});
		it('transforms with `theme` property', async () => {
			const ast = Markdoc.parse(entry);
			// @ts-expect-error AstroMarkdocConfig is incompatible with Markdoc.Config
			const config: Markdoc.Config = await getConfigExtendingShiki({ theme: 'dracula' });
			const content = (await Markdoc.transform(ast, config)) as Tag;
			assert.equal(content.children.length, 2);
			for (const codeBlock of content.children) {
				assert.equal(isHTMLString(codeBlock), true);

				const pre = parsePreTag(codeBlock as string);
				assert.equal(pre.classList.contains('astro-code'), true);
				assert.equal(pre.classList.contains('dracula'), true);
			}
		});
		it('transforms with `wrap` property', async () => {
			const ast = Markdoc.parse(entry);
			// @ts-expect-error AstroMarkdocConfig is incompatible with Markdoc.Config
			const config: Markdoc.Config = await getConfigExtendingShiki({ wrap: true });
			const content = (await Markdoc.transform(ast, config)) as Tag;
			assert.equal(content.children.length, 2);
			for (const codeBlock of content.children) {
				assert.equal(isHTMLString(codeBlock), true);

				const pre = parsePreTag(codeBlock as string);
				assert.equal(pre.getAttribute('style')!.includes('white-space: pre-wrap'), true);
				assert.equal(pre.getAttribute('style')!.includes('word-wrap: break-word'), true);
			}
		});
		it('transform within if tags', async () => {
			const ast = Markdoc.parse(`
{% if equals("true", "true") %}
Inside truthy

\`\`\`js
const hello = "yes";
\`\`\`

{% /if %}`);
			// @ts-expect-error AstroMarkdocConfig is incompatible with Markdoc.Config
			const config: Markdoc.Config = await getConfigExtendingShiki();
			const content = (await Markdoc.transform(ast, config)) as Tag;
			assert.equal(content.children.length, 1);
			const innerChildren = content.children[0] as unknown as Tag[];
			assert.equal(innerChildren.length, 2);
			const pTag = innerChildren[0] as Tag;
			assert.equal(pTag.name, 'p');
			const codeBlock = innerChildren[1];
			assert.equal(isHTMLString(codeBlock), true);
			const pre = parsePreTag(codeBlock as unknown as string);
			assert.equal(pre.classList.contains('astro-code'), true);
			assert.equal(pre.classList.contains('github-dark'), true);
		});
	});

	describe('prism', () => {
		it('transforms', async () => {
			const ast = Markdoc.parse(entry);
			// @ts-expect-error AstroMarkdocConfig is incompatible with Markdoc.Config
			const config: Markdoc.Config = await setupConfig(
				{
					extends: [prism()],
				},
				undefined,
			);
			const content = (await Markdoc.transform(ast, config)) as Tag;

			assert.equal(content.children.length, 2);
			const [tsBlock, cssBlock] = content.children;

			assert.equal(isHTMLString(tsBlock), true);
			assert.equal(isHTMLString(cssBlock), true);

			const preTs = parsePreTag(tsBlock as string);
			assert.equal(preTs.classList.contains('language-ts'), true);

			const preCss = parsePreTag(cssBlock as string);
			assert.equal(preCss.classList.contains('language-css'), true);
		});
	});
});

async function getConfigExtendingShiki(config?: Parameters<typeof shiki>[0]) {
	return await setupConfig(
		{
			extends: [shiki(config)],
		},
		undefined,
	);
}

function parsePreTag(html: string): HTMLPreElement {
	const { document } = parseHTML(html);
	const pre = document.querySelector('pre');
	assert.ok(pre);
	return pre;
}
