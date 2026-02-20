import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	cacheConfigToManifest,
	extractCacheRoutesFromRouteRules,
	normalizeCacheProviderConfig,
	normalizeRouteRuleCacheOptions,
} from '../../../dist/core/cache/utils.js';
import {
	defaultSetHeaders,
	isCacheHint,
	isLiveDataEntry,
} from '../../../dist/core/cache/runtime/utils.js';

describe('defaultSetHeaders()', () => {
	it('correct CDN-Cache-Control for maxAge only', () => {
		const headers = defaultSetHeaders({ maxAge: 300 });
		assert.equal(headers.get('CDN-Cache-Control'), 'max-age=300');
	});

	it('correct CDN-Cache-Control for maxAge + swr', () => {
		const headers = defaultSetHeaders({ maxAge: 300, swr: 60 });
		assert.equal(headers.get('CDN-Cache-Control'), 'max-age=300, stale-while-revalidate=60');
	});

	it('Cache-Tag header from tags array', () => {
		const headers = defaultSetHeaders({ maxAge: 60, tags: ['product', 'featured'] });
		assert.equal(headers.get('Cache-Tag'), 'product, featured');
	});

	it('Last-Modified header formatting', () => {
		const date = new Date('2025-06-01T12:00:00Z');
		const headers = defaultSetHeaders({ lastModified: date });
		assert.equal(headers.get('Last-Modified'), date.toUTCString());
	});

	it('ETag header', () => {
		const headers = defaultSetHeaders({ etag: '"abc123"' });
		assert.equal(headers.get('ETag'), '"abc123"');
	});

	it('empty options produces no headers', () => {
		const headers = defaultSetHeaders({});
		assert.equal([...headers.entries()].length, 0);
	});

	it('tags-only produces Cache-Tag but no CDN-Cache-Control', () => {
		const headers = defaultSetHeaders({ tags: ['a'] });
		assert.equal(headers.get('Cache-Tag'), 'a');
		assert.equal(headers.get('CDN-Cache-Control'), null);
	});
});

describe('isCacheHint()', () => {
	it('true for { tags: [...] }', () => {
		assert.equal(isCacheHint({ tags: ['a'] }), true);
	});

	it('true for { tags: [], lastModified: date }', () => {
		assert.equal(isCacheHint({ tags: [], lastModified: new Date() }), true);
	});

	it('false for null', () => {
		assert.equal(isCacheHint(null), false);
	});

	it('false for undefined', () => {
		assert.equal(isCacheHint(undefined), false);
	});

	it('false for string', () => {
		assert.equal(isCacheHint('tags'), false);
	});

	it('false for object without tags', () => {
		assert.equal(isCacheHint({ maxAge: 300 }), false);
	});
});

describe('isLiveDataEntry()', () => {
	it('true for { id, data, cacheHint }', () => {
		assert.equal(isLiveDataEntry({ id: '1', data: {}, cacheHint: { tags: [] } }), true);
	});

	it('true for entry with undefined cacheHint', () => {
		assert.equal(isLiveDataEntry({ id: '1', data: {}, cacheHint: undefined }), true);
	});

	it('false for CacheHint', () => {
		assert.equal(isLiveDataEntry({ tags: ['a'] }), false);
	});

	it('false for CacheOptions', () => {
		assert.equal(isLiveDataEntry({ maxAge: 300 }), false);
	});

	it('false for null', () => {
		assert.equal(isLiveDataEntry(null), false);
	});

	it('false for string', () => {
		assert.equal(isLiveDataEntry('entry'), false);
	});
});

describe('normalizeCacheProviderConfig()', () => {
	it('handles string entrypoint', () => {
		const result = normalizeCacheProviderConfig({
			entrypoint: '@astrojs/node/cache',
			config: { max: 1000 },
		});
		assert.equal(result.entrypoint, '@astrojs/node/cache');
		assert.deepEqual(result.config, { max: 1000 });
	});

	it('handles URL entrypoint', () => {
		const url = new URL('file:///tmp/cache-provider.js');
		const result = normalizeCacheProviderConfig({ entrypoint: url });
		assert.equal(result.entrypoint, 'file:///tmp/cache-provider.js');
		assert.equal(result.config, undefined);
	});
});

describe('normalizeRouteRuleCacheOptions()', () => {
	it('extracts flat shortcuts', () => {
		const result = normalizeRouteRuleCacheOptions({ maxAge: 300, swr: 60 });
		assert.deepEqual(result, { maxAge: 300, swr: 60, tags: undefined });
	});

	it('extracts nested cache options', () => {
		const result = normalizeRouteRuleCacheOptions({ cache: { maxAge: 3600, tags: ['products'] } });
		assert.deepEqual(result, { maxAge: 3600, swr: undefined, tags: ['products'] });
	});

	it('nested cache takes precedence over shortcuts', () => {
		const result = normalizeRouteRuleCacheOptions({
			maxAge: 100,
			swr: 10,
			cache: { maxAge: 3600 },
		});
		assert.deepEqual(result, { maxAge: 3600, swr: 10, tags: undefined });
	});

	it('returns undefined for rule with no cache options', () => {
		const result = normalizeRouteRuleCacheOptions({});
		assert.equal(result, undefined);
	});

	it('returns undefined for undefined rule', () => {
		const result = normalizeRouteRuleCacheOptions(undefined);
		assert.equal(result, undefined);
	});
});

describe('extractCacheRoutesFromRouteRules()', () => {
	it('extracts cache routes from flat shortcuts', () => {
		const result = extractCacheRoutesFromRouteRules({
			'/api/*': { swr: 600 },
			'/blog/*': { maxAge: 300 },
		});
		assert.deepEqual(result, {
			'/api/*': { maxAge: undefined, swr: 600, tags: undefined },
			'/blog/*': { maxAge: 300, swr: undefined, tags: undefined },
		});
	});

	it('extracts cache routes from nested form', () => {
		const result = extractCacheRoutesFromRouteRules({
			'/products/*': { cache: { maxAge: 3600, tags: ['products'] } },
		});
		assert.deepEqual(result, {
			'/products/*': { maxAge: 3600, swr: undefined, tags: ['products'] },
		});
	});

	it('filters out rules with no cache options', () => {
		const result = extractCacheRoutesFromRouteRules({
			'/about': {},
			'/api/*': { swr: 600 },
		});
		assert.deepEqual(result, {
			'/api/*': { maxAge: undefined, swr: 600, tags: undefined },
		});
	});

	it('returns undefined for empty routeRules', () => {
		const result = extractCacheRoutesFromRouteRules({});
		assert.equal(result, undefined);
	});

	it('returns undefined for undefined routeRules', () => {
		const result = extractCacheRoutesFromRouteRules(undefined);
		assert.equal(result, undefined);
	});
});

describe('cacheConfigToManifest()', () => {
	it('serializes correctly with routeRules', () => {
		const result = cacheConfigToManifest(
			{ provider: { entrypoint: '@astrojs/node/cache', config: { max: 500 } } },
			{ '/blog/[...path]': { maxAge: 300 } },
		);
		assert.deepEqual(result, {
			provider: '@astrojs/node/cache',
			options: { max: 500 },
			routes: { '/blog/[...path]': { maxAge: 300, swr: undefined, tags: undefined } },
		});
	});

	it('serializes with nested cache form in routeRules', () => {
		const result = cacheConfigToManifest(
			{ provider: '@astrojs/node/cache' },
			{ '/products/*': { cache: { maxAge: 3600, tags: ['products'] } } },
		);
		assert.deepEqual(result, {
			provider: '@astrojs/node/cache',
			options: undefined,
			routes: { '/products/*': { maxAge: 3600, swr: undefined, tags: ['products'] } },
		});
	});

	it('returns undefined when no cache config', () => {
		assert.equal(cacheConfigToManifest(undefined, { '/api/*': { swr: 600 } }), undefined);
	});

	it('returns undefined when no provider', () => {
		assert.equal(cacheConfigToManifest({}, { '/blog': { maxAge: 60 } }), undefined);
	});

	it('handles routeRules with no cache options', () => {
		const result = cacheConfigToManifest({ provider: '@astrojs/node/cache' }, { '/about': {} });
		assert.deepEqual(result, {
			provider: '@astrojs/node/cache',
			options: undefined,
			routes: undefined,
		});
	});
});
