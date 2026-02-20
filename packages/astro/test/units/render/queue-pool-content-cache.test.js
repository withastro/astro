import { describe, it } from 'node:test';
import { strictEqual, notStrictEqual } from 'node:assert';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';

describe('NodePool - Content-Aware Caching', () => {
	it('should cache text nodes by content', () => {
		const pool = new NodePool(1000, true, true); // Enable content cache

		// First acquisition - cache miss
		const node1 = pool.acquire('text', 'Hello');
		strictEqual(node1.type, 'text');
		strictEqual(node1.content, 'Hello');

		// Second acquisition - should be cache hit
		const node2 = pool.acquire('text', 'Hello');
		strictEqual(node2.type, 'text');
		strictEqual(node2.content, 'Hello');

		// Should be different object instances (cloned)
		notStrictEqual(node1, node2);

		// Verify stats
		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 1);
		strictEqual(stats.contentCacheMiss, 1);
	});

	it('should cache html-string nodes by content', () => {
		const pool = new NodePool(1000, true, true);

		// First acquisition
		const node1 = pool.acquire('html-string', '<div>Test</div>');
		strictEqual(node1.type, 'html-string');
		strictEqual(node1.html, '<div>Test</div>');

		// Second acquisition - cache hit
		const node2 = pool.acquire('html-string', '<div>Test</div>');
		strictEqual(node2.type, 'html-string');
		strictEqual(node2.html, '<div>Test</div>');

		// Different instances
		notStrictEqual(node1, node2);

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 1);
		strictEqual(stats.contentCacheMiss, 1);
	});

	it('should differentiate between text and html-string with same content', () => {
		const pool = new NodePool(1000, true, true);

		// Use custom content not in COMMON_HTML_PATTERNS
		const textNode = pool.acquire('text', '<custom>');
		const htmlNode = pool.acquire('html-string', '<custom>');

		strictEqual(textNode.type, 'text');
		strictEqual(textNode.content, '<custom>');
		strictEqual(htmlNode.type, 'html-string');
		strictEqual(htmlNode.html, '<custom>');

		// Both should be cache misses (different types)
		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 0);
		strictEqual(stats.contentCacheMiss, 2);
	});

	it('should allow modification of cloned nodes without affecting cache', () => {
		const pool = new NodePool(1000, true, true);

		// Get first node
		const node1 = pool.acquire('text', 'Shared');
		node1.parent = { type: 'element' };
		node1.position = 5;
		node1.originalValue = 'original1';

		// Get second node - should not have modifications from node1
		const node2 = pool.acquire('text', 'Shared');
		strictEqual(node2.parent, undefined);
		strictEqual(node2.position, undefined);
		strictEqual(node2.originalValue, undefined);
		strictEqual(node2.content, 'Shared'); // Content preserved

		// Modify node2
		node2.parent = { type: 'fragment' };
		node2.position = 10;

		// Get third node - should not have modifications from node2
		const node3 = pool.acquire('text', 'Shared');
		strictEqual(node3.parent, undefined);
		strictEqual(node3.position, undefined);
		strictEqual(node3.content, 'Shared');
	});

	it('should handle empty string content', () => {
		const pool = new NodePool(1000, true, true);

		const node1 = pool.acquire('text', '');
		const node2 = pool.acquire('text', '');

		strictEqual(node1.content, '');
		strictEqual(node2.content, '');
		notStrictEqual(node1, node2);

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 1);
	});

	it('should work when content caching is disabled', () => {
		const pool = new NodePool(1000, true, false); // Disable content cache

		pool.acquire('text', 'Hello');
		pool.acquire('text', 'Hello');

		// Should use standard pooling (not content cache)
		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 0);
		strictEqual(stats.contentCacheMiss, 0);
	});

	it('should not cache component or instruction nodes', () => {
		const pool = new NodePool(1000, true, true);

		// These types don't support content caching
		pool.acquire('component');
		pool.acquire('component');
		pool.acquire('instruction');
		pool.acquire('instruction');

		// Should use standard pooling (no content cache)
		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 0);
		strictEqual(stats.contentCacheMiss, 0);
		// All 4 nodes created new (pool starts empty)
		strictEqual(stats.acquireNew, 4);
	});

	it('should handle large content strings', () => {
		const pool = new NodePool(1000, true, true);

		const largeContent = 'x'.repeat(10000);
		const node1 = pool.acquire('text', largeContent);
		const node2 = pool.acquire('text', largeContent);

		strictEqual(node1.content, largeContent);
		strictEqual(node2.content, largeContent);
		notStrictEqual(node1, node2);

		const stats = pool.getStats();
		strictEqual(stats.contentCacheHit, 1);
	});

	it('should cache common HTML patterns', () => {
		const pool = new NodePool(1000, true, true);

		// Use custom patterns not in COMMON_HTML_PATTERNS
		const patterns = ['<details>', '<summary>', '<dialog>', '</details>', '<mark>'];

		// First pass - all cache misses
		for (const pattern of patterns) {
			const node = pool.acquire('html-string', pattern);
			strictEqual(node.html, pattern);
		}

		let stats = pool.getStats();
		strictEqual(stats.contentCacheMiss, 5);
		strictEqual(stats.contentCacheHit, 0);

		// Second pass - all cache hits
		for (const pattern of patterns) {
			const node = pool.acquire('html-string', pattern);
			strictEqual(node.html, pattern);
		}

		stats = pool.getStats();
		strictEqual(stats.contentCacheMiss, 5);
		strictEqual(stats.contentCacheHit, 5);
	});
});
