import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import shikiTwoslash from 'remark-shiki-twoslash';
import rehypePrettyCode from 'rehype-pretty-code';

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
			expect(shikiCodeBlock.getAttribute('style')).to.contain('background-color:#24292e');
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

		for (const extendMarkdownConfig of [true, false]) {
			it(`respects syntaxHighlight when extendMarkdownConfig = ${extendMarkdownConfig}`, async () => {
				const fixture = await loadFixture({
					root: FIXTURE_ROOT,
					markdown: {
						syntaxHighlight: 'shiki',
					},
					integrations: [
						mdx({
							extendMarkdownConfig,
							syntaxHighlight: 'prism',
						}),
					],
				});
				await fixture.build();

				const html = await fixture.readFile('/index.html');
				const { document } = parseHTML(html);

				const shikiCodeBlock = document.querySelector('pre.astro-code');
				expect(shikiCodeBlock, 'Markdown config syntaxHighlight used unexpectedly').to.be.null;
				const prismCodeBlock = document.querySelector('pre.language-astro');
				expect(prismCodeBlock).to.not.be.null;
			});
		}
	});

	it('supports custom highlighter - shiki-twoslash', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			markdown: {
				syntaxHighlight: false,
			},
			integrations: [
				mdx({
					remarkPlugins: [shikiTwoslash.default ?? shikiTwoslash],
				}),
			],
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const twoslashCodeBlock = document.querySelector('pre.shiki');
		expect(twoslashCodeBlock).to.not.be.null;
	});

	it('supports custom highlighter - rehype-pretty-code', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			markdown: {
				syntaxHighlight: false,
			},
			integrations: [
				mdx({
					rehypePlugins: [
						[
							rehypePrettyCode,
							{
								onVisitHighlightedLine(node) {
									node.properties.style = 'background-color:#000000';
								},
							},
						],
					],
				}),
			],
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		expect(html).to.include('style="background-color:#000000"');
	});
});
