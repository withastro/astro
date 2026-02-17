import type { QueueNode } from './types.js';
import type { SSRManifest } from '../../../../core/app/types.js';
import { queueContentCache, queuePoolSize } from '../../../../core/app/manifest.js';

/**
 * Raw statistics tracked by the node pool.
 */
export interface PoolStats {
	/** Number of times a node was successfully acquired from the pool */
	acquireFromPool: number;
	/** Number of times a new node had to be created (pool was empty) */
	acquireNew: number;
	/** Number of nodes successfully returned to the pool */
	released: number;
	/** Number of nodes that couldn't be returned (pool was full) */
	releasedDropped: number;
	/** Number of times content cache returned a cached node */
	contentCacheHit: number;
	/** Number of times content cache had to create and cache a new node */
	contentCacheMiss: number;
}

/**
 * Extended statistics report with computed metrics.
 * Returned by NodePool.getStats() for debugging and monitoring.
 */
export interface PoolStatsReport extends PoolStats {
	/** Current number of nodes available in the pool */
	poolSize: number;
	/** Maximum pool capacity */
	maxSize: number;
	/** Pool hit rate as a percentage (0-100) - higher is better */
	hitRate: number;
}

/**
 * Object pool for `QueueNode` instances to reduce allocations and GC pressure.
 * Nodes are acquired from the pool, used during queue building, and can be
 * released back to the pool for reuse across renders.
 *
 * This significantly reduces memory allocation overhead when building large queues.
 */
export class NodePool {
	private pool: QueueNode[] = [];
	private contentCache = new Map<string, QueueNode>();
	public readonly maxSize: number;
	private readonly enableStats: boolean;
	private readonly enableContentCache: boolean;
	private stats: PoolStats = {
		acquireFromPool: 0,
		acquireNew: 0,
		released: 0,
		releasedDropped: 0,
		contentCacheHit: 0,
		contentCacheMiss: 0,
	};

	/**
	 * Creates a new object pool for queue nodes.
	 *
	 * @param maxSize - Maximum number of nodes to keep in the pool (default: 1000)
	 * @param enableStats - Enable statistics tracking (default: false for performance)
	 * @param enableContentCache - Enable content-aware caching for text/HTML nodes (default: true)
	 */
	constructor(maxSize = 1000, enableContentCache = false, enableStats = false) {
		this.maxSize = maxSize;
		this.enableStats = enableStats;
		this.enableContentCache = enableContentCache;
		if (maxSize > 0) {
			// Warm up cache only if the pool size is greater than 0. We treat zero as if there's no pool.
			this.warmCache([...COMMON_HTML_PATTERNS]);
		}
	}

	/**
	 * Acquires a queue node from the pool or creates a new one if the pool is empty.
	 * Supports content-aware caching for text and HTML-string nodes.
	 *
	 * @param type - The type of queue node to create
	 * @param content - Optional content for content-aware caching (text or HTML)
	 * @returns A queue node ready to be populated with data
	 */
	acquire(type: QueueNode['type'], content?: string): QueueNode {
		if (
			this.enableContentCache &&
			content !== undefined &&
			(type === 'text' || type === 'html-string')
		) {
			const cacheKey = `${type}:${content}`;
			const cached = this.contentCache.get(cacheKey);

			if (cached) {
				if (this.enableStats) {
					this.stats.contentCacheHit = this.stats.contentCacheHit + 1;
				}
				// Clone the cached node to avoid shared state
				return this.cloneNode(cached);
			}

			// Cache miss - create template node and cache it
			if (this.enableStats) {
				this.stats.contentCacheMiss = this.stats.contentCacheMiss + 1;
			}

			// Create immutable template node for caching
			const template = this.createNode(type, content);
			this.contentCache.set(cacheKey, template);

			// Return a clone for use
			return this.cloneNode(template);
		}

		// Standard pooling (no content caching)
		const pooledNode = this.pool.pop();

		if (pooledNode) {
			if (this.enableStats) {
				this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
			}
			return this.createNode(type, '');
		}

		// Pool is empty, create new node
		if (this.enableStats) {
			this.stats.acquireNew = this.stats.acquireNew + 1;
		}

		return this.createNode(type, '');
	}

	/**
	 * Creates a new node of the specified type with the given content.
	 * Helper method to reduce branching in acquire().
	 */
	private createNode(type: QueueNode['type'], content = ''): QueueNode {
		switch (type) {
			case 'text':
				return { type: 'text', content };
			case 'html-string':
				return { type: 'html-string', html: content };
			case 'component':
				return { type: 'component', instance: undefined as any };
			case 'instruction':
				return { type: 'instruction', instruction: undefined as any };
		}
	}

	/**
	 * Clones a cached node to avoid shared state.
	 * Helper method to reduce branching in acquire().
	 */
	private cloneNode(node: QueueNode): QueueNode {
		switch (node.type) {
			case 'text':
				return { type: 'text', content: node.content };
			case 'html-string':
				return { type: 'html-string', html: node.html };
			case 'component':
				return { type: 'component', instance: node.instance };
			case 'instruction':
				return { type: 'instruction', instruction: node.instruction };
		}
	}

	/**
	 * Releases a queue node back to the pool for reuse.
	 * If the pool is at max capacity, the node is discarded (will be GC'd).
	 *
	 * @param node - The node to release back to the pool
	 */
	release(node: QueueNode): void {
		if (this.pool.length < this.maxSize) {
			this.pool.push(node);
			if (this.enableStats) {
				this.stats.released = this.stats.released + 1;
			}
		} else {
			if (this.enableStats) {
				this.stats.releasedDropped = this.stats.releasedDropped + 1;
			}
		}
		// If the pool is full, let the node be garbage collected
	}

	/**
	 * Releases all nodes in an array back to the pool.
	 * This is a convenience method for releasing multiple nodes at once.
	 *
	 * @param nodes - Array of nodes to release
	 */
	releaseAll(nodes: QueueNode[]): void {
		for (const node of nodes) {
			this.release(node);
		}
	}

	/**
	 * Clears the pool, discarding all cached nodes.
	 * This can be useful if you want to free memory after a large render.
	 */
	clear(): void {
		this.pool.length = 0;
	}

	/**
	 * Pre-warms the content cache with common patterns.
	 * This can improve cache hit rates during builds by pre-populating frequently used patterns.
	 *
	 * @param patterns - Array of {type, content} objects to pre-cache
	 */
	warmCache(patterns: Array<{ type: 'text' | 'html-string'; content: string }>): void {
		if (!this.enableContentCache) return;

		for (const { type, content } of patterns) {
			// Only warm cache if not already present
			const cacheKey = `${type}:${content}`;
			if (!this.contentCache.has(cacheKey)) {
				const template: QueueNode =
					type === 'text'
						? { type: 'text', content: content }
						: { type: 'html-string', html: content };
				this.contentCache.set(cacheKey, template);
			}
		}
	}

	/**
	 * Gets the current number of nodes in the pool.
	 * Useful for monitoring pool usage and tuning maxSize.
	 *
	 * @returns Number of nodes currently available in the pool
	 */
	size(): number {
		return this.pool.length;
	}

	/**
	 * Gets pool statistics for debugging.
	 *
	 * @returns Pool usage statistics including computed metrics
	 */
	getStats(): PoolStatsReport {
		return {
			...this.stats,
			poolSize: this.pool.length,
			maxSize: this.maxSize,
			hitRate:
				this.stats.acquireFromPool + this.stats.acquireNew > 0
					? (this.stats.acquireFromPool / (this.stats.acquireFromPool + this.stats.acquireNew)) *
						100
					: 0,
		};
	}

	/**
	 * Resets pool statistics.
	 */
	resetStats() {
		this.stats = {
			acquireFromPool: 0,
			acquireNew: 0,
			released: 0,
			releasedDropped: 0,
			contentCacheHit: 0,
			contentCacheMiss: 0,
		};
	}
}

/**
 * Common HTML patterns that appear frequently in Astro pages.
 * Pre-warming the cache with these patterns improves hit rates during builds.
 */
export const COMMON_HTML_PATTERNS = [
	// Structural elements
	{ type: 'html-string' as const, content: '<div>' },
	{ type: 'html-string' as const, content: '</div>' },
	{ type: 'html-string' as const, content: '<span>' },
	{ type: 'html-string' as const, content: '</span>' },
	{ type: 'html-string' as const, content: '<p>' },
	{ type: 'html-string' as const, content: '</p>' },
	{ type: 'html-string' as const, content: '<section>' },
	{ type: 'html-string' as const, content: '</section>' },
	{ type: 'html-string' as const, content: '<article>' },
	{ type: 'html-string' as const, content: '</article>' },
	{ type: 'html-string' as const, content: '<header>' },
	{ type: 'html-string' as const, content: '</header>' },
	{ type: 'html-string' as const, content: '<footer>' },
	{ type: 'html-string' as const, content: '</footer>' },
	{ type: 'html-string' as const, content: '<nav>' },
	{ type: 'html-string' as const, content: '</nav>' },
	{ type: 'html-string' as const, content: '<main>' },
	{ type: 'html-string' as const, content: '</main>' },
	{ type: 'html-string' as const, content: '<aside>' },
	{ type: 'html-string' as const, content: '</aside>' },

	// List elements
	{ type: 'html-string' as const, content: '<ul>' },
	{ type: 'html-string' as const, content: '</ul>' },
	{ type: 'html-string' as const, content: '<ol>' },
	{ type: 'html-string' as const, content: '</ol>' },
	{ type: 'html-string' as const, content: '<li>' },
	{ type: 'html-string' as const, content: '</li>' },

	// Void/self-closing elements
	{ type: 'html-string' as const, content: '<br>' },
	{ type: 'html-string' as const, content: '<hr>' },
	{ type: 'html-string' as const, content: '<br/>' },
	{ type: 'html-string' as const, content: '<hr/>' },

	// Heading elements
	{ type: 'html-string' as const, content: '<h1>' },
	{ type: 'html-string' as const, content: '</h1>' },
	{ type: 'html-string' as const, content: '<h2>' },
	{ type: 'html-string' as const, content: '</h2>' },
	{ type: 'html-string' as const, content: '<h3>' },
	{ type: 'html-string' as const, content: '</h3>' },
	{ type: 'html-string' as const, content: '<h4>' },
	{ type: 'html-string' as const, content: '</h4>' },

	// Inline elements
	{ type: 'html-string' as const, content: '<a>' },
	{ type: 'html-string' as const, content: '</a>' },
	{ type: 'html-string' as const, content: '<strong>' },
	{ type: 'html-string' as const, content: '</strong>' },
	{ type: 'html-string' as const, content: '<em>' },
	{ type: 'html-string' as const, content: '</em>' },
	{ type: 'html-string' as const, content: '<code>' },
	{ type: 'html-string' as const, content: '</code>' },

	// Common whitespace/formatting
	{ type: 'text' as const, content: ' ' },
	{ type: 'text' as const, content: '\n' },
	{ type: 'html-string' as const, content: ' ' },
	{ type: 'html-string' as const, content: '\n' },
] as const;

/**
 * Returns an instance of the `NodePool` based on its configuration.
 * @param config - The queued rendering configuration from the SSR manifest
 */
export function newNodePool(
	config: NonNullable<SSRManifest['experimentalQueuedRendering']>,
): NodePool {
	const poolSize = queuePoolSize(config);
	const cache = queueContentCache(config);

	return new NodePool(poolSize, cache);
}
