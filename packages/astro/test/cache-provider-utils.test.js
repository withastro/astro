import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	buildCacheControlDirectives,
	collectInvalidationTags,
	normalizeTags,
	pathTag,
	setConditionalHeaders,
} from '../dist/core/cache/provider-utils.js';

describe('cache provider-utils', () => {
	describe('pathTag', () => {
		it('generates a prefixed tag from a path', () => {
			assert.equal(pathTag('/products/123'), 'astro-path:/products/123');
		});

		it('handles root path', () => {
			assert.equal(pathTag('/'), 'astro-path:/');
		});
	});

	describe('buildCacheControlDirectives', () => {
		it('returns undefined when no caching directives', () => {
			assert.equal(buildCacheControlDirectives({}), undefined);
			assert.equal(buildCacheControlDirectives({ tags: ['foo'] }), undefined);
		});

		it('builds max-age directive', () => {
			assert.equal(buildCacheControlDirectives({ maxAge: 300 }), 'max-age=300');
		});

		it('builds max-age + stale-while-revalidate', () => {
			assert.equal(
				buildCacheControlDirectives({ maxAge: 300, swr: 60 }),
				'max-age=300, stale-while-revalidate=60',
			);
		});

		it('builds swr only', () => {
			assert.equal(buildCacheControlDirectives({ swr: 60 }), 'stale-while-revalidate=60');
		});

		it('prepends extra directives', () => {
			assert.equal(
				buildCacheControlDirectives({ maxAge: 300 }, ['public', 'durable']),
				'public, durable, max-age=300',
			);
		});

		it('combines all options', () => {
			assert.equal(
				buildCacheControlDirectives({ maxAge: 3600, swr: 120 }, ['public']),
				'public, max-age=3600, stale-while-revalidate=120',
			);
		});

		it('handles maxAge of 0', () => {
			assert.equal(buildCacheControlDirectives({ maxAge: 0 }), 'max-age=0');
		});
	});

	describe('setConditionalHeaders', () => {
		it('sets Last-Modified header', () => {
			const headers = new Headers();
			const date = new Date('2026-04-15T12:00:00Z');
			setConditionalHeaders(headers, { lastModified: date });
			assert.equal(headers.get('Last-Modified'), 'Wed, 15 Apr 2026 12:00:00 GMT');
		});

		it('sets ETag header', () => {
			const headers = new Headers();
			setConditionalHeaders(headers, { etag: '"abc123"' });
			assert.equal(headers.get('ETag'), '"abc123"');
		});

		it('sets both headers', () => {
			const headers = new Headers();
			const date = new Date('2026-04-15T12:00:00Z');
			setConditionalHeaders(headers, { lastModified: date, etag: '"abc123"' });
			assert.equal(headers.get('Last-Modified'), 'Wed, 15 Apr 2026 12:00:00 GMT');
			assert.equal(headers.get('ETag'), '"abc123"');
		});

		it('does nothing when no conditional options', () => {
			const headers = new Headers();
			setConditionalHeaders(headers, {});
			assert.equal([...headers.entries()].length, 0);
		});
	});

	describe('normalizeTags', () => {
		it('returns empty array for undefined', () => {
			assert.deepEqual(normalizeTags(undefined), []);
		});

		it('wraps a single string in an array', () => {
			assert.deepEqual(normalizeTags('products'), ['products']);
		});

		it('passes through an array', () => {
			assert.deepEqual(normalizeTags(['a', 'b']), ['a', 'b']);
		});
	});

	describe('collectInvalidationTags', () => {
		it('collects tags from options', () => {
			assert.deepEqual(collectInvalidationTags({ tags: ['products', 'home'] }), [
				'products',
				'home',
			]);
		});

		it('handles single string tag', () => {
			assert.deepEqual(collectInvalidationTags({ tags: 'products' }), ['products']);
		});

		it('adds path tag when path is set', () => {
			assert.deepEqual(collectInvalidationTags({ path: '/products/123' }), [
				'astro-path:/products/123',
			]);
		});

		it('combines tags and path tag', () => {
			const result = collectInvalidationTags({
				tags: ['products'],
				path: '/products/123',
			});
			assert.deepEqual(result, ['products', 'astro-path:/products/123']);
		});

		it('returns empty array when no tags or path', () => {
			assert.deepEqual(collectInvalidationTags({}), []);
		});
	});
});
