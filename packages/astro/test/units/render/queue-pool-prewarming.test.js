import { describe, it } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { NodePool, COMMON_HTML_PATTERNS } from '../../../dist/runtime/server/render/queue/pool.js';

describe('NodePool - Cache Pre-warming', () => {
	it('should warm cache with provided patterns', () => {
		const pool = new NodePool(1000, true, true);

		const patterns = [
			{ type: 'text', content: 'Hello' },
			{ type: 'html-string', content: '<div>' },
			{ type: 'html-string', content: '</div>' },
		];

		pool.warmCache(patterns);

		// First acquisition should be cache hit (already warmed)
		pool.acquire('text', 'Hello');
		pool.acquire('html-string', '<div>');
		pool.acquire('html-string', '</div>');

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 3, 'All 3 patterns should be cache hits');
		strictEqual(stats.contentCacheMiss, 0, 'No cache misses expected');
	});

	it('should not warm cache when content caching is disabled', () => {
		const pool = new NodePool(1000, true, false); // Disable content cache

		const patterns = [{ type: 'text', content: 'Hello' }];

		pool.warmCache(patterns); // Should be no-op

		pool.acquire('text', 'Hello');
		const stats = pool.getStats();

		strictEqual(stats.contentCacheHit, 0, 'Content caching disabled, no hits');
	});

	it('should not duplicate patterns already in cache', () => {
		const pool = new NodePool(1000, true, true);

		// Acquire first to populate cache
		pool.acquire('text', 'Test');

		// Try to warm with same pattern
		pool.warmCache([{ type: 'text', content: 'Test' }]);

		// Acquire again - should still be just 1 cache hit total (not 2)
		pool.acquire('text', 'Test');

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 1, 'Should not duplicate existing cache entries');
		strictEqual(stats.contentCacheMiss, 1, 'First acquire was cache miss');
	});

	it('should include common HTML patterns', () => {
		ok(COMMON_HTML_PATTERNS.length > 0, 'COMMON_HTML_PATTERNS should not be empty');

		// Check for some expected patterns
		const patterns = COMMON_HTML_PATTERNS.map((p) => p.content);
		ok(patterns.includes('<div>'), 'Should include <div>');
		ok(patterns.includes('</div>'), 'Should include </div>');
		ok(patterns.includes('<br>'), 'Should include <br>');
		ok(patterns.includes(' '), 'Should include space');
		ok(patterns.includes('\n'), 'Should include newline');
	});

	it.skip('should pre-warm global pool on initialization', () => {
		// Global pool should already be warmed
		// Try to acquire common patterns - should all be cache hits
		// TODO: This test expects a globalNodePool export that doesn't exist
		const stats1 = globalNodePool.getStats();
		const initialHits = stats1.contentCacheHit;

		globalNodePool.acquire('html-string', '<div>');
		globalNodePool.acquire('html-string', '</div>');
		globalNodePool.acquire('html-string', '<br>');
		globalNodePool.acquire('text', ' ');

		const stats2 = globalNodePool.getStats();
		strictEqual(
			stats2.contentCacheHit - initialHits,
			4,
			'All common patterns should be cache hits',
		);
	});

	it('should improve hit rate with pre-warming', () => {
		// Both pools start with COMMON_HTML_PATTERNS pre-warmed (automatic in constructor)
		// We test the benefit of warming ADDITIONAL custom patterns
		const poolWithoutCustomWarm = new NodePool(1000, true, true);
		const poolWithCustomWarm = new NodePool(1000, true, true);

		// Use custom patterns NOT in COMMON_HTML_PATTERNS
		const customPatterns = [
			{ type: 'html-string', content: '<custom-element>' },
			{ type: 'html-string', content: '</custom-element>' },
		];

		// Pre-warm one pool with ADDITIONAL custom patterns
		poolWithCustomWarm.warmCache(customPatterns);

		// Simulate page rendering with repeated custom patterns
		for (let i = 0; i < 100; i++) {
			poolWithoutCustomWarm.acquire('html-string', '<custom-element>');
			poolWithoutCustomWarm.acquire('html-string', '</custom-element>');
			poolWithCustomWarm.acquire('html-string', '<custom-element>');
			poolWithCustomWarm.acquire('html-string', '</custom-element>');
		}

		const stats1 = poolWithoutCustomWarm.getStats();
		const stats2 = poolWithCustomWarm.getStats();

		// Without custom warming: first two custom patterns are misses (not in COMMON_HTML_PATTERNS)
		strictEqual(stats1.contentCacheMiss, 2, 'Two custom patterns = 2 misses');
		strictEqual(stats1.contentCacheHit, 198, '198 hits after initial misses');

		// With custom warming: all are hits (custom patterns were pre-warmed)
		strictEqual(stats2.contentCacheMiss, 0, 'Custom pre-warmed = no misses');
		strictEqual(stats2.contentCacheHit, 200, 'All 200 are hits with custom pre-warming');
	});

	it('should warm cache with void elements', () => {
		const pool = new NodePool(1000, true, true);

		pool.warmCache([
			{ type: 'html-string', content: '<br>' },
			{ type: 'html-string', content: '<hr>' },
			{ type: 'html-string', content: '<br/>' },
			{ type: 'html-string', content: '<hr/>' },
		]);

		// All should be cache hits
		pool.acquire('html-string', '<br>');
		pool.acquire('html-string', '<hr>');
		pool.acquire('html-string', '<br/>');
		pool.acquire('html-string', '<hr/>');

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 4);
		strictEqual(stats.contentCacheMiss, 0);
	});

	it('should warm cache with text patterns', () => {
		const pool = new NodePool(1000, true, true);

		pool.warmCache([
			{ type: 'text', content: 'Read more' },
			{ type: 'text', content: 'Continue reading' },
			{ type: 'text', content: ' ' },
			{ type: 'text', content: '\n' },
		]);

		// All should be cache hits
		pool.acquire('text', 'Read more');
		pool.acquire('text', 'Continue reading');
		pool.acquire('text', ' ');
		pool.acquire('text', '\n');

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 4);
		strictEqual(stats.contentCacheMiss, 0);
	});
});
