import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { wrapFrontmatter } from '../../dist/rolldown-plugin-astro-frontmatter.js';

describe('wrapFrontmatter', () => {
	it('hoists a single-line import and wraps the body', () => {
		const input = 'import { foo } from "pkg";\nconst x = foo();';
		const result = wrapFrontmatter(input);
		assert.ok(result.startsWith('import { foo } from "pkg";'));
		assert.ok(result.includes('async function __astro__()'));
		assert.ok(result.includes('const x = foo();'));
	});

	it('hoists multiline imports', () => {
		const input = [
			'import {',
			'  foo,',
			'  bar,',
			'} from "some-package";',
			'const x = foo();',
		].join('\n');
		const result = wrapFrontmatter(input);
		assert.ok(result.includes('import {\n  foo,\n  bar,\n} from "some-package";'));
		assert.ok(result.includes('async function __astro__()'));
		assert.ok(result.includes('const x = foo();'));
	});

	it('preserves return statements inside the function wrapper', () => {
		const input = 'if (true) {\n\treturn new Response("Not Allowed");\n}';
		const result = wrapFrontmatter(input);
		assert.ok(result.includes('return new Response'));
		assert.ok(result.includes('async function __astro__()'));
	});

	it('handles regex literals containing quote characters (#17697)', () => {
		const input = [
			'import { h } from "preact";',
			'function escapeHtml(value) {',
			'\treturn value.replace(/"/g, "&quot;");',
			'}',
			'if (Astro.request.method !== "GET") {',
			'\treturn new Response("Method Not Allowed", { status: 405 });',
			'}',
		].join('\n');
		const result = wrapFrontmatter(input);
		// Import should be hoisted
		assert.ok(result.startsWith('import { h } from "preact";'));
		// Both returns must be preserved (not rewritten or lost)
		const returnCount = (result.match(/\breturn\b/g) || []).length;
		assert.equal(returnCount, 2, 'both return statements should be preserved');
		// The regex literal must be intact
		assert.ok(result.includes('/"/g'));
	});

	it('does not hoist import.meta references', () => {
		const input = 'import { h } from "preact";\nconst url = import.meta.url;';
		const result = wrapFrontmatter(input);
		assert.ok(result.includes('import.meta.url'));
		// import.meta.url should be inside the function, not hoisted
		const funcStart = result.indexOf('async function __astro__()');
		const metaPos = result.indexOf('import.meta.url');
		assert.ok(metaPos > funcStart, 'import.meta.url should be inside the function body');
	});

	it('handles side-effect imports', () => {
		const input = 'import "./styles.css";\nif (true) return;';
		const result = wrapFrontmatter(input);
		assert.ok(result.startsWith('import "./styles.css";'));
		assert.ok(result.includes('async function __astro__()'));
	});

	it('handles frontmatter with no imports', () => {
		const input = 'if (true) {\n\treturn;\n}';
		const result = wrapFrontmatter(input);
		// Should start directly with the function wrapper
		assert.ok(result.startsWith('async function __astro__()'));
		assert.ok(result.includes('return;'));
	});

	it('handles bare return (no value)', () => {
		const input = 'import { h } from "preact";\nif (!source) return;';
		const result = wrapFrontmatter(input);
		assert.ok(result.includes('return;'));
	});

	it('handles type imports', () => {
		const input = 'import type { Foo } from "pkg";\nconst x: Foo = {};';
		const result = wrapFrontmatter(input);
		assert.ok(result.startsWith('import type { Foo } from "pkg";'));
	});
});
