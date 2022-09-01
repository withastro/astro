import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import remarkToc from 'remark-toc';

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

	it('respects "extendDefaultPlugins" when extending markdown', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [remarkExamplePlugin],
				rehypePlugins: [rehypeExamplePlugin],
				extendDefaultPlugins: true,
			},
			integrations: [mdx()],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectRemarkExample(document)).to.not.be.null;
		expect(selectRehypeExample(document)).to.not.be.null;
		expect(selectGfmLink(document)).to.not.be.null;
	});

	it('extends markdown config with extendPlugins: "markdown"', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [remarkExamplePlugin],
				rehypePlugins: [rehypeExamplePlugin],
			},
			integrations: [
				mdx({
					extendPlugins: 'markdown',
					remarkPlugins: [remarkToc],
				}),
			],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectRemarkExample(document)).to.not.be.null;
		expect(selectRehypeExample(document)).to.not.be.null;
		expect(selectTocLink(document)).to.not.be.null;
	});

	it('extends default plugins with extendPlugins: "astroDefaults"', async () => {
		const fixture = await buildFixture({
			markdown: {
				// should NOT be applied to MDX
				remarkPlugins: [remarkToc],
			},
			integrations: [
				mdx({
					remarkPlugins: [remarkExamplePlugin],
					rehypePlugins: [rehypeExamplePlugin],
					extendPlugins: 'astroDefaults',
				}),
			],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectGfmLink(document)).to.not.be.null;
		// remark and rehype plugins still respected
		expect(selectRemarkExample(document)).to.not.be.null;
		expect(selectRehypeExample(document)).to.not.be.null;
		// Does NOT inherit TOC from markdown config
		expect(selectTocLink(document)).to.be.null;
	});

	it('does not extend default plugins with extendPlugins: false', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [remarkExamplePlugin],
			},
			integrations: [
				mdx({
					remarkPlugins: [],
					extendPlugins: false,
				}),
			],
		});

		const html = await fixture.readFile(FILE);
		const { document } = parseHTML(html);

		expect(selectGfmLink(document)).to.be.null;
		expect(selectRemarkExample(document)).to.be.null;
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

function selectTocLink(document) {
	return document.querySelector('ul a[href="#section-1"]');
}

function selectGfmLink(document) {
	return document.querySelector('a[href="https://handle-me-gfm.com"]');
}

function selectRemarkExample(document) {
	return document.querySelector('div[data-remark-plugin-works]');
}

function selectRehypeExample(document) {
	return document.querySelector('div[data-rehype-plugin-works]');
}
