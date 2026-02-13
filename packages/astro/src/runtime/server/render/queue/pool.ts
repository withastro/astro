import type { QueueNode } from './types.js';

/**
 * Object pool for QueueNode instances to reduce allocations and GC pressure.
 * Nodes are acquired from the pool, used during queue building, and can be
 * released back to the pool for reuse across renders.
 *
 * This significantly reduces memory allocation overhead when building large queues.
 */
export class QueueNodePool {
	private pool: QueueNode[] = [];
	private contentCache = new Map<string, QueueNode>();
	public readonly maxSize: number;
	private readonly enableStats: boolean;
	private readonly enableContentCache: boolean;
	private stats = {
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
	 * @param enableContentCache - Enable content-aware caching for text/html nodes (default: true)
	 */
	constructor(maxSize = 1000, enableStats = false, enableContentCache = true) {
		this.maxSize = maxSize;
		this.enableStats = enableStats;
		this.enableContentCache = enableContentCache;
	}

	/**
	 * Acquires a queue node from the pool or creates a new one if pool is empty.
	 * Supports content-aware caching for text and html-string nodes.
	 *
	 * @param type - The type of queue node to create
	 * @param content - Optional content for content-aware caching (text or html)
	 * @returns A queue node ready to be populated with data
	 */
	acquire(type: QueueNode['type'], content?: string): QueueNode {
		// Content-aware caching for text and html-string nodes
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
				// TypeScript knows cached is either TextNode or HtmlStringNode
				if (cached.type === 'text') {
					return { type: 'text', content: cached.content };
				} else if (cached.type === 'html-string') {
					return { type: 'html-string', html: cached.html };
				} else {
					// Should never happen - content cache only stores text/html-string
					throw new Error(`Unexpected cached node type: ${cached.type}`);
				}
			}

			// Cache miss - create template node and cache it
			if (this.enableStats) {
				this.stats.contentCacheMiss = this.stats.contentCacheMiss + 1;
			}

			// Create immutable template node for caching
			const template: QueueNode =
				type === 'text'
					? { type: 'text', content: content }
					: { type: 'html-string', html: content };

			// Cache the template for future reuse
			this.contentCache.set(cacheKey, template);

			// Return a clone for use
			if (type === 'text') {
				return { type: 'text', content: content };
			} else {
				return { type: 'html-string', html: content };
			}
		}

		// Standard pooling (no content caching)
		const pooledNode = this.pool.pop();

		if (pooledNode) {
			if (this.enableStats) {
				this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
			}

			// Recreate node with correct type to match discriminated union
			// We can't just mutate fields since each node type has different shape
			if (type === 'text') {
				return { type: 'text', content: '' };
			} else if (type === 'html-string') {
				return { type: 'html-string', html: '' };
			} else if (type === 'component') {
				return { type: 'component', instance: undefined as any };
			} else {
				return { type: 'instruction', instruction: undefined as any };
			}
		}

		// Pool is empty, create new node
		if (this.enableStats) {
			this.stats.acquireNew = this.stats.acquireNew + 1;
		}

		// Create node with correct shape for discriminated union
		if (type === 'text') {
			return { type: 'text', content: '' };
		} else if (type === 'html-string') {
			return { type: 'html-string', html: '' };
		} else if (type === 'component') {
			return { type: 'component', instance: undefined as any };
		} else {
			return { type: 'instruction', instruction: undefined as any };
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
		// If pool is full, let the node be garbage collected
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
	 * @returns Pool usage statistics
	 */
	getStats() {
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
 * Global pool instance that can be reused across renders.
 * This is more efficient than creating a new pool for each render.
 *
 * Stats are always tracked (minimal overhead) for monitoring pool performance.
 * Cache is pre-warmed with common HTML patterns for better hit rates.
 */
export const globalNodePool = new QueueNodePool(1000, true);

// Pre-warm the global pool cache with common patterns
globalNodePool.warmCache([...COMMON_HTML_PATTERNS]);

/**
 * Gets the appropriate pool for the given configuration.
 * If pooling is disabled (poolSize = 0), returns a no-op pool that creates nodes on demand.
 * Otherwise returns the global pool (optionally resized based on config).
 *
 * @param config - Queue rendering configuration from SSRResult
 * @returns Pool instance to use for node acquisition
 */
export function getPoolForConfig(config?: {
	enabled?: boolean;
	poolSize?: number;
	cache?: boolean;
}): QueueNodePool {
	// If pooling is disabled (poolSize = 0), return a no-op pool
	if (config?.poolSize === 0) {
		return new QueueNodePool(0, false, false); // No pooling, no content cache
	}

	// If custom pool size specified, create a new pool with that size
	const poolSize = config?.poolSize ?? 1000;
	const enableContentCache = config?.cache ?? true;

	if (poolSize !== globalNodePool.maxSize) {
		return new QueueNodePool(poolSize, true, enableContentCache);
	}

	// Use global pool
	return globalNodePool;
}
