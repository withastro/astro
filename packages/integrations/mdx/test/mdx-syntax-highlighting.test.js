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

			const shikiCodeBlock = document.querySelector('pre.shiki');
			expect(shikiCodeBlock).to.not.be.null;
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

			const shikiCodeBlock = document.querySelector('pre.shiki.dracula');
			expect(shikiCodeBlock).to.not.be.null;
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
