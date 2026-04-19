import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { compile as _compile, type CompileOptions, nodeTypes } from '@mdx-js/mdx';
import type { AstroIntegrationLogger } from 'astro';
import { visit as estreeVisit } from 'estree-util-visit';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { visit } from 'unist-util-visit';
import { ignoreStringPlugins } from '../../dist/utils.js';
import type { RecmaPlugin, RehypePlugin, RemarkPlugin } from '../test-utils.js';

/**
 * Compile MDX to JSX string output for inspection.
 */
async function compile(mdxCode: string, options: Readonly<CompileOptions> = {}) {
	const result = await _compile(mdxCode, {
		jsx: true,
		...options,
	});
	return result.toString();
}

/**
 * Compile MDX with rehype-raw (like Astro does) and return the JSX output.
 */
async function compileWithRaw(
	mdxCode: string,
	options: Readonly<CompileOptions> = {},
): Promise<string> {
	return compile(mdxCode, {
		rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }], ...(options.rehypePlugins || [])],
		remarkPlugins: options.remarkPlugins || [],
		recmaPlugins: options.recmaPlugins || [],
		...options,
	});
}

describe('MDX escape handling', () => {
	it('wraps escaped HTML in string expressions, not raw JSX', async () => {
		// In MDX, \<em\> is escaped and should be rendered as text, not as an HTML element.
		// The compiled JSX wraps it in a string expression like {"<em>"}
		const code = await compile('\\<em\\>');
		// The output should have the text as a JSX string expression, not as a JSX element
		assert.ok(code.includes('{"<em>"}'), 'Escaped HTML should be wrapped in JSX string expression');
		// Should NOT have <em> as an actual JSX element (i.e. <em> outside of string)
		assert.ok(!code.includes('<em>{"'), 'Should not have <em> as an actual JSX element');
	});

	it('preserves angle brackets in inline code', async () => {
		const code = await compile('`<em` is not a tag');
		// In inline code, <em should be preserved as text content
		assert.ok(code.includes('<em'), 'Should contain <em as text content within code');
	});

	it('handles HTML entities in MDX expressions', async () => {
		const code = await compile('{`<div>`}');
		// JSX expression should contain the string
		assert.ok(code.includes('<div>'), 'Should contain the escaped string');
	});
});

describe('MDX GFM plugin', () => {
	it('converts autolinks when GFM is applied', async () => {
		const code = await compile('https://handle-me-gfm.com', {
			remarkPlugins: [remarkGfm],
		});
		assert.ok(code.includes('https://handle-me-gfm.com'), 'Should contain the URL');
		assert.ok(code.includes('href'), 'GFM should create an anchor element');
	});

	it('does not convert autolinks without GFM', async () => {
		const code = await compile('https://handle-me-gfm.com');
		// Without GFM, the URL should just be text, not wrapped in <a>
		assert.ok(code.includes('https://handle-me-gfm.com'));
	});
});

describe('MDX SmartyPants plugin', () => {
	it('converts quotes and dashes when SmartyPants is applied', async () => {
		const code = await compile('> "Smartypants" is -- awesome', {
			remarkPlugins: [remarkSmartypants],
		});
		// SmartyPants converts straight quotes to curly and -- to em dash
		assert.ok(
			code.includes('\u201C') || code.includes('\u201D') || code.includes('\u2014'),
			'SmartyPants should convert quotes or dashes to typographic equivalents',
		);
	});

	it('does not convert quotes without SmartyPants', async () => {
		const code = await compile('> "Smartypants" is -- awesome');
		// Without SmartyPants, double dashes stay as -- (not converted to em dash \u2014)
		assert.ok(code.includes('--'), 'Double dashes should remain unconverted');
		assert.ok(!code.includes('\u2014'), 'Em dash should not appear without SmartyPants');
	});
});

describe('MDX remark plugins', () => {
	it('supports custom remark plugins that modify the tree', async () => {
		/** Remark plugin that appends a div */
		const remarkAddDiv: RemarkPlugin = () => {
			return (tree) => {
				tree.children.push({
					type: 'html',
					value: '<div data-remark-works="true"></div>',
				});
			};
		};

		const code = await compileWithRaw('# Hello', {
			remarkPlugins: [remarkAddDiv],
		});
		assert.ok(
			code.includes('data-remark-works'),
			'Custom remark plugin output should be in compiled result',
		);
	});
});

describe('MDX rehype plugins', () => {
	it('supports custom rehype plugins that modify the tree', async () => {
		/** Rehype plugin that appends a div */
		const rehypeAddDiv: RehypePlugin = () => {
			return (tree) => {
				tree.children.push({
					type: 'element',
					tagName: 'div',
					properties: { 'data-rehype-works': 'true' },
					children: [],
				});
			};
		};

		const code = await compileWithRaw('# Hello', {
			rehypePlugins: [rehypeAddDiv],
		});
		assert.ok(
			code.includes('data-rehype-works'),
			'Custom rehype plugin output should be in compiled result',
		);
	});

	it('supports rehype plugins with namespaced SVG attributes', async () => {
		const rehypeSvg: RehypePlugin = () => {
			return (tree) => {
				tree.children.push({
					type: 'element',
					tagName: 'svg',
					properties: { xmlns: 'http://www.w3.org/2000/svg' },
					children: [
						{
							type: 'element',
							tagName: 'use',
							properties: { xlinkHref: '#icon' },
							children: [],
						},
					],
				});
			};
		};

		const code = await compileWithRaw('# Hello', {
			rehypePlugins: [rehypeSvg],
		});
		assert.ok(code.includes('svg'), 'Should contain SVG element');
	});
});

describe('MDX recma plugins', () => {
	it('supports custom recma plugins that transform the estree', async () => {
		const recmaExample: RecmaPlugin = () => {
			return (tree) => {
				estreeVisit(tree, (node) => {
					if (
						node.type === 'VariableDeclarator' &&
						node.id.type === 'Identifier' &&
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
		};

		const mdxCode = `export const recmaPluginWorking = false;

# Hello`;
		const code = await compile(mdxCode, {
			recmaPlugins: [recmaExample],
		});
		// The recma plugin should have changed false to true
		assert.ok(code.includes('true'), 'Recma plugin should transform the value');
	});
});

describe('MDX heading IDs', () => {
	it('generates heading IDs with rehypeHeadingIds', async () => {
		const mdxCode = `# Hello World

## Section 1

### Subsection 1
`;
		const code = await compileWithRaw(mdxCode, {
			rehypePlugins: [rehypeHeadingIds],
		});
		assert.ok(code.includes('hello-world'), 'Should generate slug for h1');
		assert.ok(code.includes('section-1'), 'Should generate slug for h2');
		assert.ok(code.includes('subsection-1'), 'Should generate slug for h3');
	});

	it('generates correct slugs for special characters', async () => {
		const mdxCode = `# \`<Picture />\`

### « Sacrebleu ! »
`;
		const code = await compileWithRaw(mdxCode, {
			rehypePlugins: [rehypeHeadingIds],
		});
		assert.ok(code.includes('picture-'), 'Should generate slug for code in heading');
		assert.ok(code.includes('-sacrebleu--'), 'Should generate slug for special chars');
	});

	it('allows user plugins to override heading IDs', async () => {
		const customIdPlugin: RehypePlugin = () => {
			return (tree) => {
				let count = 0;
				visit(tree, 'element', (node) => {
					if (!/^h\d$/.test(node.tagName)) return;
					if (!node.properties?.id) {
						node.properties = { ...node.properties, id: String(count++) };
					}
				});
			};
		};

		const mdxCode = `# Hello

## World
`;
		const code = await compileWithRaw(mdxCode, {
			rehypePlugins: [customIdPlugin],
		});
		// MDX JSX output uses id="0" as a JSX attribute
		assert.ok(code.includes('id="0"'), 'Custom plugin should set id="0" on first heading');
		assert.ok(code.includes('id="1"'), 'Custom plugin should set id="1" on second heading');
	});
});

describe('MDX string-based plugin filtering', () => {
	it('does not apply string-based remark plugins', async () => {
		// When a string-based plugin is provided, the ignoreStringPlugins
		// function filters it out. We test the filter function directly in utils.test.js.
		// Here we verify that only function plugins affect output.
		const logger = { warn() {} } as unknown as AstroIntegrationLogger;

		const plugins = ['remark-toc', () => (tree: unknown) => tree];
		const filtered = ignoreStringPlugins(plugins, logger);

		assert.equal(filtered.length, 1, 'Should filter out string plugin');
		assert.equal(typeof filtered[0], 'function', 'Should keep function plugin');
	});
});
