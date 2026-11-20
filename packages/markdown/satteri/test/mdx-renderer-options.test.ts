import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { satteri } from '../dist/index.js';

const SHARED = { syntaxHighlight: false, shikiConfig: {} } as const;

// A hardcoded `file:///project/src/` has no drive letter, which Windows rejects.
const SRC_DIR_PATH = path.resolve('project', 'src');
const SRC_DIR = pathToFileURL(SRC_DIR_PATH + path.sep);
const PAGE_PATH = path.join(SRC_DIR_PATH, 'pages', 'index.mdx');

describe('satteri createMdxRenderer', () => {
	// Upgrading astro alone reaches this: `@astrojs/mdx` 7.0.x calls it without `srcDir`.
	it('renders when the caller omits `srcDir`', async () => {
		const renderer = await satteri().createMdxRenderer!(SHARED, { optimize: false } as any);
		const { code } = await renderer.process('# Hello\n\nSome text.\n', PAGE_PATH, {});

		assert.match(code, /MDXContent/);
		assert.doesNotMatch(code, /charset/);
	});

	it('injects the charset for a layout-less page when `srcDir` is passed', async () => {
		const renderer = await satteri().createMdxRenderer!(SHARED, {
			optimize: false,
			srcDir: SRC_DIR,
		});
		const { code } = await renderer.process('# Hello\n\nSome text.\n', PAGE_PATH, {});

		assert.match(code, /charset/);
	});
});

describe('satteri createMdxRenderer with optimize', () => {
	const svg =
		'<svg><style>.a{stroke:red}</style><defs><marker id="m"><path d="M0 0"/></marker></defs><path marker-end="url(#m)"/></svg>';

	async function renderRawHtml(html: string, optimize: true | { ignoreElementNames: string[] }) {
		const processor = satteri({
			features: { rawHtml: true },
			mdastPlugins: [
				{
					name: 'inject-html',
					paragraph(node, ctx) {
						ctx.insertAfter(node, { type: 'html', value: html });
					},
				},
			],
		});
		const renderer = await processor.createMdxRenderer!(SHARED, { optimize, srcDir: SRC_DIR });
		const { code } = await renderer.process('hi\n', PAGE_PATH, {});
		return code;
	}

	it('keeps the set:html directive of a nested <style> in an SVG', async () => {
		const code = await renderRawHtml(svg, true);
		assert.match(code, /_jsx\(_components\.style, \{ "set:html": "\.a\{stroke:red\}" \}\)/);
		assert.doesNotMatch(code, /<style set:html/);
		assert.match(code, /marker-end=\\"url\(#m\)\\"/);
	});

	it('keeps SVG attribute names when <style> is ignored', async () => {
		const code = await renderRawHtml(svg, { ignoreElementNames: ['style'] });
		assert.match(code, /marker-end=\\"url\(#m\)\\"/);
		assert.doesNotMatch(code, /markerEnd/);
	});

	it('keeps <style> content unescaped inside a static <div>', async () => {
		const code = await renderRawHtml('<div><style>a<b&c{color:red}</style><p>text</p></div>', true);
		assert.match(code, /"set:html": "a<b&c\{color:red\}"/);
		assert.doesNotMatch(code, /<style set:html/);
	});
});
