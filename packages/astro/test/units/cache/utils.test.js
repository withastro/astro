import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	cacheConfigToManifest,
	defaultSetHeaders,
	isCacheHint,
	isLiveDataEntry,
	normalizeCacheDriverConfig,
} from '../../../dist/core/cache/utils.js';

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

describe('normalizeCacheDriverConfig()', () => {
	it('handles string entrypoint', () => {
		const result = normalizeCacheDriverConfig({
			entrypoint: '@astrojs/node/cache',
			config: { max: 1000 },
		});
		assert.equal(result.entrypoint, '@astrojs/node/cache');
		assert.deepEqual(result.config, { max: 1000 });
	});

	it('handles URL entrypoint', () => {
		const url = new URL('file:///tmp/cache-driver.js');
		const result = normalizeCacheDriverConfig({ entrypoint: url });
		assert.equal(result.entrypoint, '/tmp/cache-driver.js');
		assert.equal(result.config, undefined);
	});
});

describe('cacheConfigToManifest()', () => {
	it('serializes correctly', () => {
		const result = cacheConfigToManifest({
			driver: { entrypoint: '@astrojs/node/cache', config: { max: 500 } },
			routes: { '/blog/[...path]': { maxAge: 300 } },
		});
		assert.deepEqual(result, {
			driver: '@astrojs/node/cache',
			options: { max: 500 },
			routes: { '/blog/[...path]': { maxAge: 300 } },
		});
	});

	it('returns undefined when no config', () => {
		assert.equal(cacheConfigToManifest(undefined), undefined);
	});

	it('returns undefined when no driver', () => {
		assert.equal(cacheConfigToManifest({ routes: { '/blog': { maxAge: 60 } } }), undefined);
	});
});
