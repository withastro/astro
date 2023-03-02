import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import remarkToc from 'remark-toc';
import { visit as estreeVisit } from 'estree-util-visit';

const FIXTURE_ROOT = new URL('./fixtures/mdx-plugins/', import.meta.url);
const FILE = '/with-plugins/index.html';

describe('MDX plugins', () => {
	it('supports custom remark plugins - TOC', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx({
					remarkPlugins: [remarkToc],
				}),
			],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectTocLink(document)).to.not.be.null;
	});

	it('Applies GFM by default', async () => {
		const fixture = await buildFixture({
			integrations: [mdx()],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectGfmLink(document)).to.not.be.null;
	});

	it('Applies SmartyPants by default', async () => {
		const fixture = await buildFixture({
			integrations: [mdx()],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		const quote = selectSmartypantsQuote(document);
		expect(quote).to.not.be.null;
		expect(quote.textContent).to.contain('“Smartypants” is — awesome');
	});

	it('supports custom rehype plugins', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx({
					rehypePlugins: [rehypeExamplePlugin],
				}),
			],
		});
		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectRehypeExample(document)).to.not.be.null;
	});

	it('supports custom rehype plugins with namespaced attributes', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx({
					rehypePlugins: [rehypeSvgPlugin],
				}),
			],
		});
		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectRehypeSvg(document)).to.not.be.null;
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

		expect(selectRemarkExample(document)).to.not.be.null;
		expect(selectRehypeExample(document)).to.not.be.null;
	});

	it('ignores string-based plugins in markdown config', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [['remark-toc']],
			},
			integrations: [mdx()],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectTocLink(document)).to.be.null;
	});

	for (const extendMarkdownConfig of [true, false]) {
		describe(`extendMarkdownConfig = ${extendMarkdownConfig}`, () => {
			let fixture;
			before(async () => {
				fixture = await buildFixture({
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

				expect(selectRemarkExample(document, 'MDX remark plugins not applied.')).to.not.be.null;
				expect(selectRehypeExample(document, 'MDX rehype plugins not applied.')).to.not.be.null;
			});

			it('Handles Markdown plugins', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				expect(
					selectTocLink(
						document,
						'`remarkToc` plugin applied unexpectedly. Should override Markdown config.'
					)
				).to.be.null;
			});

			it('Handles gfm', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				if (extendMarkdownConfig === true) {
					expect(selectGfmLink(document), 'Does not respect `markdown.gfm` option.').to.be.null;
				} else {
					expect(selectGfmLink(document), 'Respects `markdown.gfm` unexpectedly.').to.not.be.null;
				}
			});

			it('Handles smartypants', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				const quote = selectSmartypantsQuote(document);

				if (extendMarkdownConfig === true) {
					expect(quote.textContent, 'Does not respect `markdown.smartypants` option.').to.contain(
						'"Smartypants" is -- awesome'
					);
				} else {
					expect(quote.textContent, 'Respects `markdown.smartypants` unexpectedly.').to.contain(
						'“Smartypants” is — awesome'
					);
				}
			});
		});
	}

	it('supports custom recma plugins', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx({
					recmaPlugins: [recmaExamplePlugin],
				}),
			],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectRecmaExample(document)).to.not.be.null;
	});
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

function rehypeSvgPlugin() {
	return (tree) => {
		tree.children.push({
			type: 'element',
			tagName: 'svg',
			properties: { xmlns: 'http://www.w3.org/2000/svg' },
			children: [
				{
					type: 'element',
					tagName: 'use',
					properties: { xLinkHref: '#icon' },
				},
			],
		});
	};
}

function recmaExamplePlugin() {
	return (tree) => {
		estreeVisit(tree, (node) => {
			if (
				node.type === 'VariableDeclarator' &&
				node.id.name === 'recmaPluginWorking' &&
				node.init?.type === 'Literal'
			) {
				node.init = {
					...(node.init ?? {}),
					value: true,
					raw: 'true',
				};
			}
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

function selectRehypeSvg(document) {
	return document.querySelector('svg > use[xlink\\:href]');
}

function selectRecmaExample(document) {
	return document.querySelector('div[data-recma-plugin-works]');
}
