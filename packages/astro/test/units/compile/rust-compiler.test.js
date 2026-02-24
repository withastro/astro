import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { compile } from '../../../dist/core/compile/compile-rs.js';

/**
 * @param {string} source
 * @param {object} [configOverrides]
 */
async function compileWithRust(source, configOverrides = {}) {
	const viteConfig = await resolveConfig({ configFile: false }, 'serve');
	return compile({
		astroConfig: {
			root: pathToFileURL('/'),
			base: '/',
			experimental: { rustCompiler: true },
			compressHTML: false,
			scopedStyleStrategy: 'attribute',
			devToolbar: { enabled: false },
			site: undefined,
			...configOverrides,
		},
		viteConfig,
		toolbarEnabled: false,
		filename: '/src/components/index.astro',
		source,
	});
}

describe('experimental.rustCompiler - core compile', () => {
	it('compiles a basic Astro component', async () => {
		const result = await compileWithRust('<h1>Hello World</h1>');
		assert.ok(result.code);
	});

	it('compiles a component with frontmatter', async () => {
		const result = await compileWithRust(`\
---
const greeting = 'Hello';
---
<h1>{greeting}</h1>`);
		assert.ok(result.code);
	});

	it('returns a source map', async () => {
		const result = await compileWithRust('<h1>Hello</h1>');
		assert.ok(result.map);
	});

	it('returns a scope string', async () => {
		const result = await compileWithRust('<h1>Hello</h1>');
		assert.equal(typeof result.scope, 'string');
	});

	it('returns populated css array for styled components', async () => {
		const result = await compileWithRust(`\
<style>h1 { color: red; }</style>
<h1>Hello</h1>`);
		assert.ok(Array.isArray(result.css));
		assert.equal(result.css.length, 1);
		assert.ok(result.css[0].code);
	});

	it('returns empty css array for unstyled components', async () => {
		const result = await compileWithRust('<h1>Hello</h1>');
		assert.ok(Array.isArray(result.css));
		assert.equal(result.css.length, 0);
	});

	it('returns populated scripts array for components with scripts', async () => {
		const result = await compileWithRust(`\
<script>
console.log('hello');
</script>
<h1>Hello</h1>`);
		assert.ok(Array.isArray(result.scripts));
		assert.equal(result.scripts.length, 1);
	});

	it('returns empty scripts array for components without scripts', async () => {
		const result = await compileWithRust('<h1>Hello</h1>');
		assert.ok(Array.isArray(result.scripts));
		assert.equal(result.scripts.length, 0);
	});

	it('detects head content', async () => {
		const result = await compileWithRust(`\
<head>
  <title>My Page</title>
</head>
<body><h1>Hello</h1></body>`);
		assert.equal(result.containsHead, true);
	});

	it('reports containsHead as false when no head element present', async () => {
		const result = await compileWithRust('<h1>Hello</h1>');
		assert.equal(result.containsHead, false);
	});

	it('marks global styles with isGlobal', async () => {
		const result = await compileWithRust(`\
<style is:global>
  h1 { color: blue; }
</style>
<h1>Global</h1>`);
		assert.equal(result.css.length, 1);
		assert.equal(result.css[0].isGlobal, true);
	});

	it('marks scoped styles with isGlobal false', async () => {
		const result = await compileWithRust(`\
<style>
  h1 { color: blue; }
</style>
<h1>Scoped</h1>`);
		assert.equal(result.css.length, 1);
		assert.equal(result.css[0].isGlobal, false);
	});

	it('returns one css entry per style block', async () => {
		const result = await compileWithRust(`\
<style>h1 { color: red; }</style>
<style>p { color: blue; }</style>
<h1>Hello</h1>
<p>World</p>`);
		assert.equal(result.css.length, 2);
	});

	it('throws a CompilerError on unclosed tags', async () => {
		await assert.rejects(
			() => compileWithRust('<p>Unclosed tag'),
			(err) => {
				assert.ok(err.message || err.name);
				assert.ok(err.message.includes('Unexpected token'));
				return true;
			},
		);
	});

	it('handles empty component without throwing', async () => {
		const result = await compileWithRust('');
		assert.ok(result.code !== undefined);
	});
});
