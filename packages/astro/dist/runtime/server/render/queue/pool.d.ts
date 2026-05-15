import type { QueueNode } from './types.js';
import type { SSRManifest } from '../../../../core/app/types.js';
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
 *
 * Uses type-aware sub-pools so that released nodes are reused by the same
 * node type, preserving V8 hidden classes and avoiding shape transitions.
 * Nodes are acquired from the pool, used during queue building, and released
 * back to the pool for reuse across renders.
 *
 * String deduplication is handled separately by `HTMLStringCache`.
 */
export declare class NodePool {
	private textPool;
	private htmlStringPool;
	private componentPool;
	private instructionPool;
	readonly maxSize: number;
	private readonly enableStats;
	private stats;
	/**
	 * Creates a new object pool for queue nodes.
	 *
	 * @param maxSize - Maximum number of nodes to keep in the pool (default: 1000).
	 *   The cap is shared across all typed sub-pools.
	 * @param enableStats - Enable statistics tracking (default: false for performance)
	 */
	constructor(maxSize?: number, enableStats?: boolean);
	/**
	 * Acquires a queue node from the pool or creates a new one if the pool is empty.
	 * Pops from the type-specific sub-pool to reuse an existing object when available.
	 *
	 * @param type - The type of queue node to acquire
	 * @param content - Optional content to set on the node (for text or html-string types)
	 * @returns A queue node ready to be populated with data
	 */
	acquire(type: QueueNode['type'], content?: string): QueueNode;
	/**
	 * Creates a new node of the specified type with the given content.
	 * Helper method to reduce branching in acquire().
	 */
	private createNode;
	/**
	 * Pops a node from the type-specific sub-pool.
	 * Returns undefined if the sub-pool for the requested type is empty.
	 */
	private popFromTypedPool;
	/**
	 * Resets the content/value field on a reused pooled node.
	 * The type discriminant is already correct since we pop from the matching sub-pool.
	 */
	private resetNodeContent;
	/**
	 * Returns the total number of nodes across all typed sub-pools.
	 */
	private totalPoolSize;
	/**
	 * Releases a queue node back to the pool for reuse.
	 * If the pool is at max capacity, the node is discarded (will be GC'd).
	 *
	 * @param node - The node to release back to the pool
	 */
	release(node: QueueNode): void;
	/**
	 * Releases all nodes in an array back to the pool.
	 * This is a convenience method for releasing multiple nodes at once.
	 *
	 * @param nodes - Array of nodes to release
	 */
	releaseAll(nodes: QueueNode[]): void;
	/**
	 * Clears all typed sub-pools, discarding all cached nodes.
	 * This can be useful if you want to free memory after a large render.
	 */
	clear(): void;
	/**
	 * Gets the current total number of nodes across all typed sub-pools.
	 * Useful for monitoring pool usage and tuning maxSize.
	 *
	 * @returns Number of nodes currently available in the pool
	 */
	size(): number;
	/**
	 * Gets pool statistics for debugging.
	 *
	 * @returns Pool usage statistics including computed metrics
	 */
	getStats(): PoolStatsReport;
	/**
	 * Resets pool statistics.
	 */
	resetStats(): void;
}
/**
 * Returns an instance of the `NodePool` based on its configuration.
 * @param config - The queued rendering configuration from the SSR manifest
 */
export declare function newNodePool(
	config: NonNullable<SSRManifest['experimentalQueuedRendering']>,
): NodePool;
