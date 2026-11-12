import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compile as _compile, type CompileOptions, nodeTypes } from '@mdx-js/mdx';
import rehypeRaw from 'rehype-raw';
import { rehypeCollapseScriptStyle } from '../dist/mdx/rehype-collapse-script-style.js';
import { type OptimizeOptions, rehypeOptimizeStatic } from '../dist/mdx/rehype-optimize-static.js';

async function compile(mdxCode: string, options?: Readonly<CompileOptions>) {
	const result = await _compile(mdxCode, {
		jsx: true,
		rehypePlugins: [rehypeOptimizeStatic],
		...options,
	});
	const code = result.toString();
	// Capture the returned JSX code for testing
	const jsx = /return (.+);\n\}\nexport default function MDXContent/s.exec(code)?.[1];
	if (jsx == null) throw new Error('Could not find JSX code in compiled MDX');
	return dedent(jsx);
}

function dedent(str: string) {
	const lines = str.split('\n');
	if (lines.length <= 1) return str;
	// Get last line indent, and dedent this amount for the other lines
	const lastLineIndent = /^\s*/.exec(lines[lines.length - 1])![0].length;
	return lines
		.map((line: string, i: number) => (i === 0 ? line : line.slice(lastLineIndent)))
		.join('\n');
}

describe('rehype-optimize-static', () => {
	it('works', async () => {
		const jsx = await compile(`# hello`);
		assert.equal(
			jsx,
			`\
<_components.h1 {...{
  "set:html": "hello"
}} />`,
		);
	});

	it('groups sibling nodes as a single Fragment', async () => {
		const jsx = await compile(`\
# hello

foo bar
`);
		assert.equal(
			jsx,
			`\
<Fragment set:html="<h1>hello</h1>
<p>foo bar</p>" />`,
		);
	});

	it('skips optimization of components', async () => {
		const jsx = await compile(`\
import Comp from './Comp.jsx';

# hello

This is a <Comp />
`);
		assert.equal(
			jsx,
			`\
<><Fragment set:html="<h1>hello</h1>
" /><_components.p>{"This is a "}<Comp /></_components.p></>`,
		);
	});

	it('optimizes explicit html elements', async () => {
		const jsx = await compile(`\
# hello

foo <strong>bar</strong> baz

<strong>qux</strong>
`);
		assert.equal(
			jsx,
			`\
<Fragment set:html="<h1>hello</h1>
<p>foo <strong>bar</strong> baz</p>
<strong>qux</strong>" />`,
		);
	});

	describe('with raw HTML from a plugin', () => {
		const svg =
			'<svg><style>.a{stroke:red}</style><defs><marker id="m"><path d="M0 0"/></marker></defs><path marker-end="url(#m)"/></svg>';

		// Mirrors the order in `create-processor.ts`: raw HTML is parsed, then script/style
		// content is collapsed into `set:html`, then static subtrees are optimized.
		function compileRawHtml(html: string, optimizeOptions?: OptimizeOptions) {
			return compile('hi', {
				remarkPlugins: [
					() => (tree: any) => {
						tree.children.push({ type: 'html', value: html });
					},
				],
				rehypePlugins: [
					[rehypeRaw, { passThrough: nodeTypes }],
					rehypeCollapseScriptStyle,
					[rehypeOptimizeStatic, optimizeOptions],
				],
			});
		}

		it('keeps the set:html directive of a nested <style> in an SVG', async () => {
			const jsx = await compileRawHtml(svg);
			assert.match(
				jsx,
				/<_components\.style \{\.\.\.\{\s*"set:html": "\.a\{stroke:red\}"\s*\}\} \/>/,
			);
			assert.doesNotMatch(jsx, /<style set:html/);
			assert.match(jsx, /marker-end=&quot;url\(#m\)&quot;/);
		});

		it('serializes SVG children with SVG attribute names when <style> is ignored', async () => {
			const jsx = await compileRawHtml(svg, { ignoreElementNames: ['style'] });
			assert.match(jsx, /marker-end=&quot;url\(#m\)&quot;/);
			assert.doesNotMatch(jsx, /markerEnd/);
		});

		it('keeps <style> content unescaped inside a static <div>', async () => {
			const jsx = await compileRawHtml('<div><style>a<b&c{color:red}</style><p>text</p></div>');
			assert.match(jsx, /"set:html": "a<b&c\{color:red\}"/);
			assert.doesNotMatch(jsx, /<style set:html/);
		});
	});
});
