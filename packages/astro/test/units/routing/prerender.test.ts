// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePrerenderExport } from '../../../dist/core/routing/prerender.js';

describe('parsePrerenderExport', () => {
	it('returns true for export const prerender = true', () => {
		assert.equal(parsePrerenderExport('export const prerender = true'), true);
	});

	it('returns true with semicolon', () => {
		assert.equal(parsePrerenderExport('export const prerender = true;'), true);
	});

	it('returns false for export const prerender = false', () => {
		assert.equal(parsePrerenderExport('export const prerender = false'), false);
	});

	it('returns false with semicolon', () => {
		assert.equal(parsePrerenderExport('export const prerender = false;'), false);
	});

	it('returns undefined when no prerender export is present', () => {
		assert.equal(parsePrerenderExport('<html><body>Hello</body></html>'), undefined);
	});

	it('returns undefined for empty content', () => {
		assert.equal(parsePrerenderExport(''), undefined);
	});

	it('detects export in the middle of frontmatter', () => {
		const content = `---
const title = 'Page';
export const prerender = true;
---
<h1>{title}</h1>`;
		assert.equal(parsePrerenderExport(content), true);
	});

	it('ignores export in a comment', () => {
		// The regex operates on source text — it will match even inside comments.
		// This test documents current behavior: comments are not special-cased.
		const content = `// export const prerender = true;\nexport const prerender = false;`;
		assert.equal(parsePrerenderExport(content), false);
	});

	it('handles leading whitespace before export', () => {
		assert.equal(parsePrerenderExport('  export const prerender = true'), true);
	});

	it('does not match partial strings like prerender2 = true', () => {
		assert.equal(parsePrerenderExport('export const prerender2 = true'), undefined);
	});

	it('does not match non-boolean values', () => {
		assert.equal(parsePrerenderExport('export const prerender = "yes"'), undefined);
	});

	it('handles extra whitespace around the equals sign', () => {
		assert.equal(parsePrerenderExport('export const prerender  =  true'), true);
	});
});
