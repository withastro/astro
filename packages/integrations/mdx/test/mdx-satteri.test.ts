import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { parseHTML } from 'linkedom';
import { defineHastPlugin, type MdastPluginDefinition } from 'satteri';
import { loadFixture, type Fixture } from './test-utils.ts';

const injectFrontmatter: MdastPluginDefinition = {
	name: 'inject-frontmatter',
	heading(_node, ctx) {
		ctx.data.astro!.frontmatter.injected = 'from-plugin';
	},
};

describe('MDX with the Sätteri processor', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-get-headings/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				processor: satteri({ mdastPlugins: [injectFrontmatter] }),
			},
		});

		await fixture.build();
	});

	it('renders headings through the Sätteri MDX pipeline', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);

		assert.equal(document.querySelector('h1')?.id, 'heading-test');
		const h2Ids = Array.from(document.querySelectorAll('h2')).map((el) => el?.id);
		assert.equal(h2Ids.includes('section-1'), true);
		assert.equal(h2Ids.includes('section-2'), true);
	});

	it('exposes the same headings via getHeadings()', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		const slugs = headingsByPage['./test.mdx'].map((h: { slug: string }) => h.slug);
		assert.ok(slugs.includes('heading-test'));
		assert.ok(slugs.includes('section-1'));
		assert.ok(slugs.includes('section-2'));
	});

	it('lets a Sätteri plugin modify frontmatter, exposed via the page export', async () => {
		const { frontmatterByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		assert.equal(frontmatterByPage['./test.mdx'].injected, 'from-plugin');
		assert.equal(frontmatterByPage['./test-with-frontmatter.mdx'].injected, 'from-plugin');
		assert.equal(frontmatterByPage['./test-with-frontmatter.mdx'].title, 'The Frontmatter Title');
	});
});

describe('MDX Sätteri highlighting routes through components.pre', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-satteri-highlight-pre/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				processor: satteri(),
			},
		});

		await fixture.build();
	});

	it('renders highlighted code blocks through a custom `pre` component', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const pre = document.querySelector('pre');
		assert.equal(pre?.getAttribute('data-custom-pre'), 'rendered');
		assert.match(pre?.innerHTML ?? '', /style="color:/);
	});
});

describe('MDX Sätteri highlighting routes through components.pre with optimize', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-satteri-highlight-pre-optimize/', import.meta.url),
			integrations: [mdx({ optimize: true })],
			markdown: {
				processor: satteri(),
			},
		});

		await fixture.build();
	});

	it('keeps highlighted blocks addressable by `components.pre` when optimized', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const pre = document.querySelector('pre');
		assert.equal(pre?.getAttribute('data-custom-pre'), 'rendered');
		assert.match(pre?.innerHTML ?? '', /style="color:/);
	});
});

describe('MDX Sätteri attribute name casing', () => {
	let fixture: Fixture;

	// Properties use hast's camelCase names, so the emitted attribute names reveal
	// the casing the compiler applied.
	const appendSvg = defineHastPlugin({
		name: 'append-svg',
		element: {
			filter: ['a'],
			visit(node, ctx) {
				ctx.appendChild(node, {
					type: 'element',
					tagName: 'svg',
					properties: { className: ['glyph'], viewBox: '0 0 12 12', ariaHidden: 'true' },
					children: [
						{
							type: 'element',
							tagName: 'path',
							properties: {
								d: 'M7 1.5h3.5V5M10.5 1.5 5.5 6.5',
								fill: 'none',
								stroke: 'currentColor',
								strokeWidth: '1.2',
								strokeOpacity: '0.9',
								fillOpacity: '0.9',
								fillRule: 'evenodd',
								clipPath: 'url(#c)',
								fontSize: '10',
								textAnchor: 'middle',
								vectorEffect: 'non-scaling-stroke',
								paintOrder: 'stroke',
							},
							children: [],
						},
					],
				});
			},
		},
	});

	function attributesOf(html: string, selector: string) {
		const { document } = parseHTML(html);
		const element = document.querySelector(selector);
		assert.ok(element, `expected to find \`${selector}\` in the rendered page`);
		return Object.fromEntries(
			Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
		);
	}

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-satteri-attribute-case/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				processor: satteri({ hastPlugins: [appendSvg] }),
			},
		});

		await fixture.build();
	});

	it('emits HTML attribute names for plugin-added elements', async () => {
		const html = await fixture.readFile('/from-mdx/index.html');

		// `viewBox` stays camelCase: it is the real SVG attribute name, not a hast spelling.
		assert.deepEqual(attributesOf(html, 'svg'), {
			class: 'glyph',
			viewBox: '0 0 12 12',
			'aria-hidden': 'true',
		});

		assert.deepEqual(attributesOf(html, 'path'), {
			d: 'M7 1.5h3.5V5M10.5 1.5 5.5 6.5',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '1.2',
			'stroke-opacity': '0.9',
			'fill-opacity': '0.9',
			'fill-rule': 'evenodd',
			'clip-path': 'url(#c)',
			'font-size': '10',
			'text-anchor': 'middle',
			'vector-effect': 'non-scaling-stroke',
			'paint-order': 'stroke',
		});
	});

	it('leaves attributes on author-written JSX alone', async () => {
		const html = await fixture.readFile('/from-mdx/index.html');

		// The casing option covers rehype-produced elements only. `className` still
		// reaches the HTML as `class` because the JSX runtime maps that one prop.
		assert.deepEqual(attributesOf(html, '#author-jsx'), {
			id: 'author-jsx',
			class: 'kept',
			strokeWidth: '9',
		});
	});

	it('matches the `.md` pipeline attribute for attribute', async () => {
		const mdHtml = await fixture.readFile('/from-md/index.html');
		const mdxHtml = await fixture.readFile('/from-mdx/index.html');

		assert.deepEqual(attributesOf(mdxHtml, 'path'), attributesOf(mdHtml, 'path'));
		assert.deepEqual(attributesOf(mdxHtml, 'svg'), attributesOf(mdHtml, 'svg'));
	});
});
