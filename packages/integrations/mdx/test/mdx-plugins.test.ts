import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { unified } from '@astrojs/markdown-remark';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import { parseHTML } from 'linkedom';
import remarkToc from 'remark-toc';
import { defineHastPlugin } from 'satteri';
import {
	loadFixture,
	type AstroInlineConfig,
	type Fixture,
	type RehypePlugin,
	type RemarkPlugin,
} from './test-utils.ts';

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
									// A rehype plugin added by an integration only runs on the
									// remark/rehype pipeline, so opt into unified() explicitly.
									processor: unified({
										rehypePlugins: [rehypeExamplePlugin],
									}),
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

	describe('markdown.processor inheritance', () => {
		it('inherits `markdown.processor` by default', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-processor-inherited/',
				markdown: { processor: satteriWithMarker() },
				integrations: [mdx()],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectSatteriMarker(document), null);
		});

		it('does not inherit `markdown.processor` when `extendMarkdownConfig` is false', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-processor-not-inherited/',
				markdown: { processor: satteriWithMarker() },
				integrations: [mdx({ extendMarkdownConfig: false })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.equal(selectSatteriMarker(document), null);
		});

		it('keeps an explicit `mdx({ processor })` over the deprecated plugin options', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-processor-explicit/',
				integrations: [
					mdx({ processor: satteriWithMarker(), remarkPlugins: [remarkExamplePlugin] }),
				],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectSatteriMarker(document), null);
			assert.equal(selectRemarkExample(document), null);
		});
	});

	describe('deprecated plugin options never replace the processor', () => {
		it('ignores them and keeps a Sätteri `markdown.processor` rendering `.mdx`', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-legacy-satteri/',
				markdown: { processor: satteriWithMarker() },
				integrations: [mdx({ remarkPlugins: [remarkExamplePlugin] })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectSatteriMarker(document), null, 'Sätteri processor was replaced.');
			assert.equal(selectRemarkExample(document), null);
		});

		it('ignores `recmaPlugins` without replacing a Sätteri processor', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-legacy-recma/',
				markdown: { processor: satteriWithMarker() },
				integrations: [mdx({ recmaPlugins: [recmaExamplePlugin] })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectSatteriMarker(document), null, 'Sätteri processor was replaced.');
			assert.notEqual(
				selectRecmaExample(document)?.getAttribute('data-recma-plugin-works'),
				'true',
				'recma plugin ran, so the processor was replaced.',
			);
		});

		it('folds them into an already-`unified` processor, replacing per key', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-legacy-unified/',
				markdown: { processor: unified({ remarkPlugins: [remarkToc] }) },
				integrations: [mdx({ remarkPlugins: [remarkExamplePlugin] })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectRemarkExample(document), null, 'MDX remark plugins not applied.');
			assert.equal(selectTocLink(document), null, 'Should replace the processor plugins.');
		});

		it('treats an empty list as an opt-out from the processor plugins', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-legacy-empty/',
				markdown: { processor: unified({ remarkPlugins: [remarkToc] }) },
				integrations: [mdx({ remarkPlugins: [] })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.equal(selectTocLink(document), null, '`remarkPlugins: []` did not opt out.');
		});

		it('inherits the processor plugins when the option is absent', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-legacy-absent/',
				markdown: { processor: unified({ remarkPlugins: [remarkToc] }) },
				integrations: [mdx()],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectTocLink(document), null, 'Processor plugins were not inherited.');
		});
	});

	describe('gfm precedence', () => {
		it('lets `mdx({ gfm })` override the processor own feature', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-gfm-mdx-wins/',
				markdown: { processor: satteri({ features: { gfm: false } }) },
				integrations: [mdx({ gfm: true })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.notEqual(selectGfmLink(document), null);
		});

		it('honours the processor own feature when `extendMarkdownConfig` is false', async () => {
			const fixture = await buildFixture({
				outDir: './dist/mdx-plugins-gfm-processor-wins/',
				integrations: [mdx({ extendMarkdownConfig: false, processor: unified({ gfm: false }) })],
			});
			const { document } = parseHTML(await fixture.readFile(FILE));

			assert.equal(selectGfmLink(document), null);
		});
	});

	for (const extendMarkdownConfig of [true, false]) {
		describe(`extendMarkdownConfig = ${extendMarkdownConfig}`, () => {
			let fixture: Fixture;
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

				assert.notEqual(selectRemarkExample(document), null, 'MDX remark plugins not applied.');
				assert.notEqual(selectRehypeExample(document), null, 'MDX rehype plugins not applied.');
			});

			it('Handles Markdown plugins', async () => {
				const html = await fixture.readFile(FILE);
				const { document } = parseHTML(html);

				assert.equal(
					selectTocLink(document),
					null,
					'`remarkToc` plugin applied unexpectedly. Should override Markdown config.',
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

				const quote = selectSmartypantsQuote(document)!;

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

async function buildFixture(config: AstroInlineConfig = {}): Promise<Fixture> {
	const fixture = await loadFixture({
		root: FIXTURE_ROOT,
		...config,
	});
	await fixture.build();
	return fixture;
}

// A fresh processor per fixture: integrations extend the pipeline by mutating `processor.options`.
function satteriWithMarker() {
	return satteri({
		hastPlugins: [
			defineHastPlugin({
				name: 'append-marker',
				element: {
					filter: ['h1'],
					visit(node, ctx) {
						ctx.appendChild(node, {
							type: 'element',
							tagName: 'span',
							properties: { id: 'satteri-plugin-works' },
							children: [],
						});
					},
				},
			}),
		],
	});
}

const remarkExamplePlugin: RemarkPlugin = () => {
	return (tree) => {
		tree.children.push({
			type: 'html',
			value: '<div data-remark-plugin-works="true"></div>',
		});
	};
};

// Flips the fixture's `export let recmaPluginWorking = false`, which it binds to a `data-` attribute.
const recmaExamplePlugin = () => {
	return (tree: any) => {
		for (const node of tree.body) {
			const declaration = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
			if (declaration?.type !== 'VariableDeclaration') continue;
			for (const declarator of declaration.declarations) {
				if (declarator.id?.name === 'recmaPluginWorking') {
					declarator.init = { type: 'Literal', value: true, raw: 'true' };
				}
			}
		}
	};
};

const rehypeExamplePlugin: RehypePlugin = () => {
	return (tree) => {
		tree.children.push({
			type: 'element',
			tagName: 'div',
			properties: { 'data-rehype-plugin-works': 'true' },
			children: [],
		});
	};
};

function selectTocLink(document: Document) {
	return document.querySelector('ul a[href="#section-1"]');
}

function selectGfmLink(document: Document) {
	return document.querySelector('a[href="https://handle-me-gfm.com"]');
}

function selectSmartypantsQuote(document: Document) {
	return document.querySelector('blockquote');
}

function selectRecmaExample(document: Document) {
	return document.querySelector('div[data-recma-plugin-works]');
}

function selectSatteriMarker(document: Document) {
	return document.querySelector('h1 span#satteri-plugin-works');
}

function selectRemarkExample(document: Document) {
	return document.querySelector('div[data-remark-plugin-works]');
}

function selectRehypeExample(document: Document) {
	return document.querySelector('div[data-rehype-plugin-works]');
}
