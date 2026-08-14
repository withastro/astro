import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	AppwriteCacheError,
	CACHE_KEY_MAX_LENGTH,
	normalizeCacheKey,
	normalizePathReference,
	planInvalidations,
	resolveCredentials,
	resolveDomains,
	toCacheKeys,
} from '../dist/cache/utils.js';

describe('cache keys', () => {
	describe('normalizeCacheKey', () => {
		it('keeps a plain tag as-is', () => {
			assert.equal(normalizeCacheKey('products'), 'products');
		});

		it('keeps the characters Astro tags conventionally use', () => {
			assert.equal(normalizeCacheKey('products:123'), 'products:123');
			assert.equal(normalizeCacheKey('astro-path:/products/123'), 'astro-path:/products/123');
		});

		it('trims surrounding whitespace', () => {
			assert.equal(normalizeCacheKey('  products  '), 'products');
		});

		it('encodes inner whitespace, which the edge would split the key on', () => {
			assert.equal(normalizeCacheKey('two words'), 'two%20words');
			assert.equal(normalizeCacheKey('tab\tseparated'), 'tab%09separated');
		});

		it('encodes commas, which would corrupt the CDN cache-tag header', () => {
			assert.equal(normalizeCacheKey('a,b'), 'a%2Cb');
		});

		it('encodes percent signs so the encoding stays reversible', () => {
			assert.equal(normalizeCacheKey('50%off'), '50%25off');
			// A tag that already looks encoded must not collide with the tag it
			// would decode to.
			assert.notEqual(normalizeCacheKey('two%20words'), normalizeCacheKey('two words'));
		});

		it('encodes non-ASCII as UTF-8 bytes', () => {
			assert.equal(normalizeCacheKey('café'), 'caf%C3%A9');
			assert.equal(normalizeCacheKey('🚀'), '%F0%9F%9A%80');
		});

		it('returns null for a tag with no content', () => {
			assert.equal(normalizeCacheKey(''), null);
			assert.equal(normalizeCacheKey('   '), null);
		});

		it('returns null for a tag too long to be invalidated', () => {
			const longest = 'a'.repeat(CACHE_KEY_MAX_LENGTH);
			assert.equal(normalizeCacheKey(longest), longest);
			assert.equal(normalizeCacheKey(`${longest}a`), null);
		});

		it('measures the length after encoding', () => {
			// 43 × 3 encoded bytes = 129 characters.
			assert.equal(normalizeCacheKey('é'.repeat(43)), null);
		});
	});

	describe('toCacheKeys', () => {
		it('returns an empty list when there are no tags', () => {
			assert.deepEqual(toCacheKeys(undefined), []);
			assert.deepEqual(toCacheKeys([]), []);
		});

		it('preserves declaration order', () => {
			assert.deepEqual(toCacheKeys(['b', 'a', 'c']), ['b', 'a', 'c']);
		});

		it('deduplicates tags that normalize to the same key', () => {
			assert.deepEqual(toCacheKeys(['products', ' products ', 'products']), ['products']);
		});

		it('drops the tags it cannot represent, keeping the rest', () => {
			assert.deepEqual(toCacheKeys(['products', '', 'a'.repeat(200), 'featured']), [
				'products',
				'featured',
			]);
		});
	});
});

const DOMAINS = ['example.appwrite.network'];

describe('planInvalidations', () => {
	it('plans nothing when there is nothing to purge', () => {
		assert.deepEqual(planInvalidations({}, DOMAINS), []);
		assert.deepEqual(planInvalidations({ tags: [] }, DOMAINS), []);
	});

	it('plans one tag purge per tag', () => {
		assert.deepEqual(planInvalidations({ tags: ['products', 'featured'] }, DOMAINS), [
			{ domain: 'example.appwrite.network', type: 'tag', reference: 'products' },
			{ domain: 'example.appwrite.network', type: 'tag', reference: 'featured' },
		]);
	});

	it('accepts a single tag as a string', () => {
		assert.deepEqual(planInvalidations({ tags: 'products' }, DOMAINS), [
			{ domain: 'example.appwrite.network', type: 'tag', reference: 'products' },
		]);
	});

	it('normalizes a tag the same way the response header does', () => {
		assert.deepEqual(planInvalidations({ tags: ['two words'] }, DOMAINS), [
			{ domain: 'example.appwrite.network', type: 'tag', reference: 'two%20words' },
		]);
	});

	it('plans a path purge, which Appwrite supports natively', () => {
		assert.deepEqual(planInvalidations({ path: '/products/123' }, DOMAINS), [
			{ domain: 'example.appwrite.network', type: 'path', reference: '/products/123' },
		]);
	});

	it('plans tags and a path together', () => {
		assert.deepEqual(planInvalidations({ tags: ['products'], path: '/products' }, DOMAINS), [
			{ domain: 'example.appwrite.network', type: 'tag', reference: 'products' },
			{ domain: 'example.appwrite.network', type: 'path', reference: '/products' },
		]);
	});

	it('repeats every purge for every domain', () => {
		const plan = planInvalidations({ tags: ['products'], path: '/products' }, [
			'example.appwrite.network',
			'example.com',
		]);
		assert.deepEqual(
			plan.map(({ domain, reference }) => `${domain}${reference}`),
			[
				'example.appwrite.networkproducts',
				'example.appwrite.network/products',
				'example.comproducts',
				'example.com/products',
			],
		);
	});
});

describe('normalizePathReference', () => {
	it('keeps an absolute path', () => {
		assert.equal(normalizePathReference('/products/123'), '/products/123');
	});

	it('makes a relative path absolute', () => {
		assert.equal(normalizePathReference('products/123'), '/products/123');
	});

	it('resolves relative segments the API would reject', () => {
		assert.equal(normalizePathReference('/products/../admin'), '/admin');
		assert.equal(normalizePathReference('/products/./123'), '/products/123');
	});

	it('drops the query and fragment', () => {
		assert.equal(normalizePathReference('/products?page=2#top'), '/products');
	});

	it('reduces a full URL to its path', () => {
		assert.equal(normalizePathReference('https://example.com/products/123'), '/products/123');
	});

	it('encodes characters the API would reject', () => {
		assert.equal(normalizePathReference('/products/two words'), '/products/two%20words');
	});
});

const SITE_ENV = {
	APPWRITE_FUNCTION_API_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
	APPWRITE_FUNCTION_PROJECT_ID: 'my-project',
};

describe('resolveCredentials', () => {
	it('reads the endpoint and project from the runtime, and the key from the request', () => {
		assert.deepEqual(resolveCredentials({}, { apiKey: 'dynamic-key' }, SITE_ENV), {
			endpoint: 'https://fra.cloud.appwrite.io/v1',
			projectId: 'my-project',
			apiKey: 'dynamic-key',
		});
	});

	it('falls back to the site-flavoured environment variables', () => {
		const credentials = resolveCredentials(
			{},
			{ apiKey: 'dynamic-key' },
			{
				APPWRITE_SITE_API_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
				APPWRITE_SITE_PROJECT_ID: 'site-project',
			},
		);
		assert.equal(credentials.endpoint, 'https://nyc.cloud.appwrite.io/v1');
		assert.equal(credentials.projectId, 'site-project');
	});

	it('falls back to Appwrite Cloud when no endpoint is known', () => {
		const credentials = resolveCredentials(
			{},
			{ apiKey: 'dynamic-key' },
			{
				APPWRITE_FUNCTION_PROJECT_ID: 'my-project',
			},
		);
		assert.equal(credentials.endpoint, 'https://cloud.appwrite.io/v1');
	});

	it('falls back to APPWRITE_API_KEY outside of a request', () => {
		const credentials = resolveCredentials({}, undefined, {
			...SITE_ENV,
			APPWRITE_API_KEY: 'static-key',
		});
		assert.equal(credentials.apiKey, 'static-key');
	});

	it('prefers explicit config over everything else', () => {
		const credentials = resolveCredentials(
			{ endpoint: 'https://appwrite.example.com/v1', projectId: 'other', apiKey: 'configured' },
			{ apiKey: 'dynamic-key' },
			{ ...SITE_ENV, APPWRITE_API_KEY: 'static-key' },
		);
		assert.deepEqual(credentials, {
			endpoint: 'https://appwrite.example.com/v1',
			projectId: 'other',
			apiKey: 'configured',
		});
	});

	it('explains how to supply a missing project', () => {
		assert.throws(() => resolveCredentials({}, { apiKey: 'dynamic-key' }, {}), {
			name: 'AppwriteCacheError',
			message: /APPWRITE_FUNCTION_PROJECT_ID/,
		});
	});

	it('explains how to supply a missing API key', () => {
		assert.throws(() => resolveCredentials({}, undefined, SITE_ENV), {
			name: 'AppwriteCacheError',
			message: /proxy\.invalidations\.write/,
		});
	});
});

describe('resolveDomains', () => {
	it('purges the domain the request was served on', () => {
		assert.deepEqual(resolveDomains({}, { domain: 'example.appwrite.network' }), [
			'example.appwrite.network',
		]);
	});

	it('prefers the configured domain', () => {
		assert.deepEqual(resolveDomains({ domain: 'example.com' }, { domain: 'ignored.example' }), [
			'example.com',
		]);
	});

	it('accepts several domains', () => {
		assert.deepEqual(resolveDomains({ domain: ['example.com', 'www.example.com'] }, undefined), [
			'example.com',
			'www.example.com',
		]);
	});

	it('normalizes and deduplicates domains', () => {
		assert.deepEqual(resolveDomains({ domain: [' Example.com ', 'example.com'] }, undefined), [
			'example.com',
		]);
	});

	it('explains how to supply a missing domain', () => {
		assert.throws(() => resolveDomains({}, undefined), {
			name: 'AppwriteCacheError',
			message: /pass `domain` to `cacheAppwrite\(\)`/,
		});
		assert.throws(() => resolveDomains({ domain: '  ' }, undefined), AppwriteCacheError);
	});
});
