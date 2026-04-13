import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { parseHTML } from 'linkedom';
import remarkToc from 'remark-toc';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-plugins/', import.meta.url);
const FILE = '/with-plugins/index.html';

describe('MDX plugins - Astro config integration', () => {
	it('supports custom rehype plugins from integrations', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx(),
				{
					name: 'test',
					hooks: {
						'astro:config:setup': ({ updateConfig }) => {
							updateConfig({
								markdown: {
									rehypePlugins: [rehypeExamplePlugin],
								},
							});
						},
					},
				},
			],
		});
		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		assert.notEqual(selectRehypeExample(document), null);
	});

	it('extends markdown config by default', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [remarkExamplePlugin],
				rehypePlugins: [rehypeExamplePlugin],
			},
			integrations: [mdx()],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		assert.notEqual(selectRemarkExample(document), null);
		assert.notEqual(selectRehypeExample(document), null);
	});

	for (const extendMarkdownConfig of [true, false]) {
		describe(`extendMarkdownConfig = ${extendMarkdownConfig}`, () => {
			let fixture;
			before(async () => {
				fixture = await buildFixture({
					// Use unique outDir to avoid cache pollution between builds with different configs
					outDir: `./dist/mdx-plugins-extend-${extendMarkdownConfig}/`,
					markdown: {
						remarkPlugins: [remarkToc],
						gfm: false,
						smartypants: false,
					},
					integrations: [
						mdx({
							extendMarkdownConfig,
							remarkPlugins: [remarkExamplePlugin],
							rehypePlugins: [rehypeExamplePlugin],
						}),
					],
				});
			});

			it('Handles MDX plugins', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				assert.notEqual(selectRemarkExample(document, 'MDX remark plugins not applied.'), null);
				assert.notEqual(selectRehypeExample(document, 'MDX rehype plugins not applied.'), null);
			});

			it('Handles Markdown plugins', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				assert.equal(
					selectTocLink(
						document,
						'`remarkToc` plugin applied unexpectedly. Should override Markdown config.',
					),
					null,
				);
			});

			it('Handles gfm', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				if (extendMarkdownConfig === true) {
					assert.equal(selectGfmLink(document), null, 'Does not respect `markdown.gfm` option.');
				} else {
					assert.notEqual(selectGfmLink(document), null, 'Respects `markdown.gfm` unexpectedly.');
				}
			});

			it('Handles smartypants', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				const quote = selectSmartypantsQuote(document);

				if (extendMarkdownConfig === true) {
					// smartypants: false inherited from markdown config — straight quotes and dashes preserved
					assert.equal(
						quote.textContent.includes('--'),
						true,
						'Does not respect `markdown.smartypants` option: dashes should remain as --.',
					);
				} else {
					// smartypants defaults to ON — converts quotes to curly and -- to em dash
					assert.equal(
						quote.textContent.includes('\u2014'),
						true,
						'Smartypants should be ON when not extending markdown config: -- should become em dash.',
					);
				}
			});
		});
	}
});

async function buildFixture(config) {
	const fixture = await loadFixture({
		root: FIXTURE_ROOT,
		...config,
	});
	await fixture.build();
	return fixture;
}

function remarkExamplePlugin() {
	return (tree) => {
		tree.children.push({
			type: 'html',
			value: '<div data-remark-plugin-works="true"></div>',
		});
	};
}

function rehypeExamplePlugin() {
	return (tree) => {
		tree.children.push({
			type: 'element',
			tagName: 'div',
			properties: { 'data-rehype-plugin-works': 'true' },
		});
	};
}

function selectTocLink(document) {
	return document.querySelector('ul a[href="#section-1"]');
}

function selectGfmLink(document) {
	return document.querySelector('a[href="https://handle-me-gfm.com"]');
}

function selectSmartypantsQuote(document) {
	return document.querySelector('blockquote');
}

function selectRemarkExample(document) {
	return document.querySelector('div[data-remark-plugin-works]');
}

function selectRehypeExample(document) {
	return document.querySelector('div[data-rehype-plugin-works]');
}
