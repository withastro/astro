import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compile as _compile, type CompileOptions, nodeTypes } from '@mdx-js/mdx';
import rehypeRaw from 'rehype-raw';
import { rehypeCollapseScriptStyle } from '../dist/mdx/rehype-collapse-script-style.js';
import { rehypeOptimizeStatic } from '../dist/mdx/rehype-optimize-static.js';

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

	describe('raw HTML from remark plugins', () => {
		const svg =
			'<svg viewBox="0 0 100 20"><style>.a>b{stroke:red}</style><defs><marker id="m"><path d="M0 0L10 5"/></marker></defs><path d="M5 10H90" marker-end="url(#m)"/></svg>';

		// Mirrors the MDX processor: raw HTML is parsed by rehype-raw and literal
		// script/style content is collapsed before the optimizer runs
		function compileWithRawSvg(optimizeOptions?: { ignoreElementNames?: string[] }) {
			return compile('hello', {
				remarkPlugins: [() => (tree: any) => void tree.children.push({ type: 'html', value: svg })],
				rehypePlugins: [
					[rehypeRaw, { passThrough: nodeTypes }],
					rehypeCollapseScriptStyle,
					[rehypeOptimizeStatic, optimizeOptions],
				],
			});
		}

		it('serializes collapsed style content as element content', async () => {
			const jsx = await compileWithRawSvg();
			assert.match(jsx, /<style>\.a>b\{stroke:red\}<\/style>/);
			assert.doesNotMatch(jsx, /set:html=\\?"\.a/);
			assert.match(jsx, /marker-end=/);
		});

		it('keeps SVG attribute names when serializing children of an svg', async () => {
			const jsx = await compileWithRawSvg({ ignoreElementNames: ['style'] });
			assert.match(jsx, /marker-end=/);
			assert.doesNotMatch(jsx, /markerEnd/);
		});
	});
});
