// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	normalizeRewritePathname,
	setOriginPathname,
	getOriginPathname,
} from '../../../dist/core/routing/rewrite.js';

describe('normalizeRewritePathname', () => {
	describe('no base path', () => {
		it('passes through a simple pathname (file format)', () => {
			const result = normalizeRewritePathname('/about', '/', 'ignore', 'file');
			assert.equal(result.pathname, '/about');
			assert.equal(result.resolvedUrlPathname, '/about');
		});

		it('passes through root path', () => {
			const result = normalizeRewritePathname('/', '/', 'ignore', 'file');
			assert.equal(result.pathname, '/');
			assert.equal(result.resolvedUrlPathname, '/');
		});

		it('passes through nested path', () => {
			const result = normalizeRewritePathname('/blog/post-1', '/', 'ignore', 'file');
			assert.equal(result.pathname, '/blog/post-1');
			assert.equal(result.resolvedUrlPathname, '/blog/post-1');
		});
	});

	describe('with base path', () => {
		it('strips base from pathname', () => {
			const result = normalizeRewritePathname('/docs/about', '/docs/', 'never', 'directory');
			assert.equal(result.pathname, 'about');
			assert.equal(result.resolvedUrlPathname, '/docs/about');
		});

		it('handles base path root with trailingSlash always', () => {
			const result = normalizeRewritePathname('/docs/', '/docs/', 'always', 'directory');
			assert.equal(result.pathname, '/');
			assert.equal(result.resolvedUrlPathname, '/docs/');
		});

		it('handles base path root with trailingSlash never', () => {
			const result = normalizeRewritePathname('/docs', '/docs/', 'never', 'directory');
			assert.equal(result.pathname, '');
			assert.equal(result.resolvedUrlPathname, '/docs');
		});

		it('strips base from nested path (never)', () => {
			const result = normalizeRewritePathname('/docs/guide/intro', '/docs/', 'never', 'directory');
			assert.equal(result.pathname, 'guide/intro');
			assert.equal(result.resolvedUrlPathname, '/docs/guide/intro');
		});

		it('strips base from nested path (always)', () => {
			const result = normalizeRewritePathname('/docs/guide/intro', '/docs/', 'always', 'directory');
			// After base stripping: 'guide/intro/', no leading slash (base was stripped)
			assert.equal(result.pathname, 'guide/intro/');
			assert.equal(result.resolvedUrlPathname, '/docs/guide/intro/');
		});
	});

	describe('trailingSlash: always (directory format)', () => {
		it('does not modify pathname when no base (trailing slash only applies during base stripping)', () => {
			// Without a base, the function doesn't touch trailing slashes in pathname
			const result = normalizeRewritePathname('/about', '/', 'always', 'directory');
			assert.equal(result.pathname, '/about');
			assert.equal(result.resolvedUrlPathname, '/about');
		});

		it('preserves existing trailing slash', () => {
			const result = normalizeRewritePathname('/about/', '/', 'always', 'directory');
			assert.equal(result.pathname, '/about/');
		});
	});

	describe('trailingSlash: never', () => {
		it('does not modify pathname when no base (trailing slash only applies during base stripping)', () => {
			const result = normalizeRewritePathname('/about/', '/', 'never', 'directory');
			assert.equal(result.pathname, '/about/');
			assert.equal(result.resolvedUrlPathname, '/about/');
		});

		it('preserves path without trailing slash', () => {
			const result = normalizeRewritePathname('/about', '/', 'never', 'directory');
			assert.equal(result.pathname, '/about');
		});

		it('converts root with base to empty string', () => {
			const result = normalizeRewritePathname('/docs/', '/docs/', 'never', 'directory');
			assert.equal(result.pathname, '');
			assert.equal(result.resolvedUrlPathname, '/docs');
		});
	});

	describe('buildFormat: file', () => {
		it('strips .html extension', () => {
			const result = normalizeRewritePathname('/about.html', '/', 'ignore', 'file');
			assert.equal(result.pathname, '/about');
		});

		it('does not strip .html from middle of path', () => {
			const result = normalizeRewritePathname('/about.html/more', '/', 'ignore', 'file');
			assert.equal(result.pathname, '/about.html/more');
		});

		it('strips .html with base path', () => {
			const result = normalizeRewritePathname('/docs/about.html', '/docs/', 'ignore', 'file');
			assert.equal(result.pathname, 'about');
		});
	});

	describe('combined: base + trailingSlash + buildFormat', () => {
		it('base + never + file format strips both .html and trailing slash', () => {
			const result = normalizeRewritePathname('/docs/about.html', '/docs/', 'never', 'file');
			assert.equal(result.pathname, 'about');
			assert.equal(result.resolvedUrlPathname, '/docs/about');
		});

		it('base + never + directory format strips base', () => {
			const result = normalizeRewritePathname('/docs/about/', '/docs/', 'never', 'directory');
			assert.equal(result.pathname, 'about');
			assert.equal(result.resolvedUrlPathname, '/docs/about');
		});

		it('base + always + directory format appends slash after base strip', () => {
			const result = normalizeRewritePathname('/docs/about', '/docs/', 'always', 'directory');
			// After base stripping: 'about/', no leading slash
			assert.equal(result.pathname, 'about/');
			assert.equal(result.resolvedUrlPathname, '/docs/about/');
		});
	});

	describe('edge cases', () => {
		it('path not under base is left unchanged', () => {
			const result = normalizeRewritePathname('/other/page', '/docs/', 'never', 'directory');
			assert.equal(result.pathname, '/other/page');
			assert.equal(result.resolvedUrlPathname, '/docs/other/page');
		});

		it('collapses double slashes in pathname', () => {
			const result = normalizeRewritePathname('//about', '/', 'never', 'file');
			assert.equal(result.pathname, '/about');
			assert.equal(result.resolvedUrlPathname, '/about');
		});
	});
});

describe('setOriginPathname / getOriginPathname', () => {
	it('stores and retrieves a pathname with directory format', () => {
		const req = new Request('http://example.com/about');
		setOriginPathname(req, '/about', 'ignore', 'directory');
		// ignore + directory => shouldAppendSlash = true
		assert.equal(getOriginPathname(req), '/about/');
	});

	it('stores and retrieves with file format (no slash appended)', () => {
		const req = new Request('http://example.com/about');
		setOriginPathname(req, '/about', 'ignore', 'file');
		assert.equal(getOriginPathname(req), '/about');
	});

	it('applies trailing slash always', () => {
		const req = new Request('http://example.com/about');
		setOriginPathname(req, '/about', 'always', 'directory');
		assert.equal(getOriginPathname(req), '/about/');
	});

	it('applies trailing slash never', () => {
		const req = new Request('http://example.com/about/');
		setOriginPathname(req, '/about/', 'never', 'directory');
		assert.equal(getOriginPathname(req), '/about');
	});

	it('preserves root path slash', () => {
		const req = new Request('http://example.com/');
		setOriginPathname(req, '/', 'never', 'directory');
		assert.equal(getOriginPathname(req), '/');
	});

	it('handles undefined pathname', () => {
		const req = new Request('http://example.com/');
		// @ts-expect-error Testing runtime behavior with undefined pathname
		setOriginPathname(req, undefined, 'ignore', 'directory');
		assert.equal(getOriginPathname(req), '/');
	});

	it('falls back to request URL when no origin set', () => {
		const req = new Request('http://example.com/fallback');
		assert.equal(getOriginPathname(req), '/fallback');
	});

	it('handles encoded characters', () => {
		const req = new Request('http://example.com/');
		setOriginPathname(req, '/café', 'never', 'file');
		assert.equal(getOriginPathname(req), '/café');
	});
});
