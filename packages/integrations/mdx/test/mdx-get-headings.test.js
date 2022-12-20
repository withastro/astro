import { rehypeHeadingSlugs } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import { visit } from 'unist-util-visit';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX getHeadings', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-get-headings/', import.meta.url),
			integrations: [mdx()],
		});

		await fixture.build();
	});

	it('adds anchor IDs to headings', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);

		const h2Ids = document.querySelectorAll('h2').map((el) => el?.id);
		const h3Ids = document.querySelectorAll('h3').map((el) => el?.id);
		expect(document.querySelector('h1').id).to.equal('heading-test');
		expect(h2Ids).to.contain('section-1');
		expect(h2Ids).to.contain('section-2');
		expect(h3Ids).to.contain('subsection-1');
		expect(h3Ids).to.contain('subsection-2');
	});

	it('generates correct getHeadings() export', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		// TODO: make this a snapshot test :)
		expect(JSON.stringify(headingsByPage['./test.mdx'])).to.equal(
			JSON.stringify([
				{ depth: 1, slug: 'heading-test', text: 'Heading test' },
				{ depth: 2, slug: 'section-1', text: 'Section 1' },
				{ depth: 3, slug: 'subsection-1', text: 'Subsection 1' },
				{ depth: 3, slug: 'subsection-2', text: 'Subsection 2' },
				{ depth: 2, slug: 'section-2', text: 'Section 2' },
			])
		);
	});

	it('generates correct getHeadings() export for JSX expressions', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		expect(JSON.stringify(headingsByPage['./test-with-jsx-expressions.mdx'])).to.equal(
			JSON.stringify([
				{
					depth: 1,
					slug: 'heading-test-with-jsx-expressions',
					text: 'Heading test with JSX expressions',
				},
				{ depth: 2, slug: 'h2title', text: 'h2Title' },
				{ depth: 3, slug: 'h3title', text: 'h3Title' },
			])
		);
	});
});

describe('MDX heading IDs can be customized by user plugins', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-get-headings/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				rehypePlugins: [
					() => (tree) => {
						let count = 0;
						visit(tree, 'element', (node, index, parent) => {
							if (!/^h\d$/.test(node.tagName)) return;
							if (!node.properties?.id) {
								node.properties = { ...node.properties, id: String(count++) };
							}
						});
					},
				],
			},
		});

		await fixture.build();
	});

	it('adds user-specified IDs to HTML output', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);

		const h1 = document.querySelector('h1');
		expect(h1?.textContent).to.equal('Heading test');
		expect(h1?.getAttribute('id')).to.equal('0');

		const headingIDs = document.querySelectorAll('h1,h2,h3').map((el) => el.id);
		expect(JSON.stringify(headingIDs)).to.equal(
			JSON.stringify(Array.from({ length: headingIDs.length }, (_, idx) => String(idx)))
		);
	});

	it('generates correct getHeadings() export', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		expect(JSON.stringify(headingsByPage['./test.mdx'])).to.equal(
			JSON.stringify([
				{ depth: 1, slug: '0', text: 'Heading test' },
				{ depth: 2, slug: '1', text: 'Section 1' },
				{ depth: 3, slug: '2', text: 'Subsection 1' },
				{ depth: 3, slug: '3', text: 'Subsection 2' },
				{ depth: 2, slug: '4', text: 'Section 2' },
			])
		);
	});
});

describe('MDX heading IDs can be injected before user plugins', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-get-headings/', import.meta.url),
			integrations: [
				mdx({
					rehypePlugins: [
						rehypeHeadingSlugs,
						() => (tree) => {
							visit(tree, 'element', (node, index, parent) => {
								if (!/^h\d$/.test(node.tagName)) return;
								if (node.properties?.id) {
									node.children.push({ type: 'text', value: ' ' + node.properties.id });
								}
							});
						},
					],
				}),
			],
		});

		await fixture.build();
	});

	it('adds user-specified IDs to HTML output', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);

		const h1 = document.querySelector('h1');
		expect(h1?.textContent).to.equal('Heading test heading-test');
		expect(h1?.id).to.equal('heading-test');
	});
});
