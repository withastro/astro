import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import Markdoc from '@markdoc/markdoc';
import { shiki } from '../dist/config.js';
import { setupConfig } from '../dist/runtime.js';
import { isHTMLString } from 'astro/runtime/server/index.js';

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
	it('transforms with defaults', async () => {
		const ast = Markdoc.parse(entry);
		const content = Markdoc.transform(ast, await getConfigExtendingShiki());

		expect(content.children).to.have.lengthOf(2);
		for (const codeBlock of content.children) {
			expect(isHTMLString(codeBlock)).to.be.true;

			const pre = parsePreTag(codeBlock);
			expect(pre.classList).to.include('astro-code');
			expect(pre.classList).to.include('github-dark');
		}
	});
	it('transforms with `theme` property', async () => {
		const ast = Markdoc.parse(entry);
		const content = Markdoc.transform(
			ast,
			await getConfigExtendingShiki({
				theme: 'dracula',
			})
		);
		expect(content.children).to.have.lengthOf(2);
		for (const codeBlock of content.children) {
			expect(isHTMLString(codeBlock)).to.be.true;

			const pre = parsePreTag(codeBlock);
			expect(pre.classList).to.include('astro-code');
			expect(pre.classList).to.include('dracula');
		}
	});
	it('transforms with `wrap` property', async () => {
		const ast = Markdoc.parse(entry);
		const content = Markdoc.transform(
			ast,
			await getConfigExtendingShiki({
				wrap: true,
			})
		);
		expect(content.children).to.have.lengthOf(2);
		for (const codeBlock of content.children) {
			expect(isHTMLString(codeBlock)).to.be.true;

			const pre = parsePreTag(codeBlock);
			expect(pre.getAttribute('style')).to.include('white-space: pre-wrap');
			expect(pre.getAttribute('style')).to.include('word-wrap: break-word');
		}
	});
});

/**
 * @param {import('astro').ShikiConfig} config
 * @returns {import('../src/config.js').AstroMarkdocConfig}
 */
async function getConfigExtendingShiki(config) {
	return setupConfig({
		extends: [await shiki(config)],
	});
}

/**
 * @param {string} html
 * @returns {HTMLPreElement}
 */
function parsePreTag(html) {
	const { document } = parseHTML(html);
	const pre = document.querySelector('pre');
	expect(pre).to.exist;
	return pre;
}
