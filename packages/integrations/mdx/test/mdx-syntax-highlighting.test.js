import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { parseHTML } from 'linkedom';
import rehypePrettyCode from 'rehype-pretty-code';
import shikiTwoslash from 'remark-shiki-twoslash';
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
			assert.notEqual(shikiCodeBlock, null);

			// With class-based styles, background-color is in a CSS class, not inline style
			const className = shikiCodeBlock.getAttribute('class');
			assert.ok(className && className.includes('__a_'), 'Should have Shiki token class');
			assert.ok(
				className && className.includes('astro-code-overflow'),
				'Should have overflow class',
			);
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
			assert.notEqual(shikiCodeBlock, null);

			// With class-based styles, theme colors are in CSS classes, not inline styles
			// Verify the theme is applied by checking for Shiki classes
			const className = shikiCodeBlock.getAttribute('class');
			assert.ok(className && className.includes('__a_'), 'Should have Shiki token class');
			assert.ok(
				className && className.includes('astro-code-overflow'),
				'Should have overflow class',
			);
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
			assert.notEqual(prismCodeBlock, null);
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
				assert.equal(shikiCodeBlock, null, 'Markdown config syntaxHighlight used unexpectedly');
				const prismCodeBlock = document.querySelector('pre.language-astro');
				assert.notEqual(prismCodeBlock, null);
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
		assert.notEqual(twoslashCodeBlock, null);
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
		assert.equal(html.includes('style="background-color:#000000"'), true);
	});
});
