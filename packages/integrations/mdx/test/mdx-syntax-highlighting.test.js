import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-syntax-hightlighting/', import.meta.url);

describe('MDX syntax highlighting', () => {
	describe('shiki', () => {
		it('works', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					syntaxHighlight: 'shiki',
				},
				integrations: [mdx()],
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const shikiCodeBlock = document.querySelector('pre.astro-code');
			expect(shikiCodeBlock).to.not.be.null;
			expect(shikiCodeBlock.getAttribute('style')).to.contain('background-color:#0d1117');
		});

		it('respects markdown.shikiConfig.theme', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					syntaxHighlight: 'shiki',
					shikiConfig: {
						theme: 'dracula',
					},
				},
				integrations: [mdx()],
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const shikiCodeBlock = document.querySelector('pre.astro-code');
			expect(shikiCodeBlock).to.not.be.null;
			expect(shikiCodeBlock.getAttribute('style')).to.contain('background-color:#282A36');
		});
	});

	describe('prism', () => {
		it('works', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					syntaxHighlight: 'prism',
				},
				integrations: [mdx()],
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const prismCodeBlock = document.querySelector('pre.language-astro');
			expect(prismCodeBlock).to.not.be.null;
		});
	});
});
