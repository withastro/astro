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
	public readonly maxSize: number;
	private enableStats: boolean;
	private stats = {
		acquireFromPool: 0,
		acquireNew: 0,
		released: 0,
		releasedDropped: 0,
	};

	/**
	 * Creates a new object pool for queue nodes.
	 *
	 * @param maxSize - Maximum number of nodes to keep in the pool (default: 1000)
	 * @param enableStats - Enable statistics tracking (default: false for performance)
	 */
	constructor(maxSize = 1000, enableStats = false) {
		this.maxSize = maxSize;
		this.enableStats = enableStats;
	}

	/**
	 * Acquires a queue node from the pool or creates a new one if pool is empty.
	 * The node is returned in a clean state with only the type field set.
	 *
	 * @param type - The type of queue node to create
	 * @returns A queue node ready to be populated with data
	 */
	acquire(type: QueueNode['type']): QueueNode {
		const node = this.pool.pop();

		if (node) {
			if (this.enableStats) {
				this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
			}
			// Reset the node to clean state, keeping only type
			// This is faster than creating a new object
			node.type = type;
			node.parent = undefined;
			node.children = undefined;
			node.tagName = undefined;
			node.props = undefined;
			node.hasChildren = undefined;
			node.factory = undefined;
			node.instance = undefined;
			node.isPropagator = undefined;
			node.displayName = undefined;
			node.promise = undefined;
			node.resolved = undefined;
			node.resolvedValue = undefined;
			node.content = undefined;
			node.html = undefined;
			node.instruction = undefined;
			node.slotName = undefined;
			node.slotFn = undefined;
			node.originalValue = undefined;
			node.position = undefined;
			return node;
		}

		// Pool is empty, create new node
		if (this.enableStats) {
			this.stats.acquireNew = this.stats.acquireNew + 1;
		}
		return { type } as QueueNode;
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
		};
	}
}

/**
 * Global pool instance that can be reused across renders.
 * This is more efficient than creating a new pool for each render.
 * 
 * Stats are always tracked (minimal overhead) for monitoring pool performance.
 */
export const globalNodePool = new QueueNodePool(1000, true);

/**
 * Gets the appropriate pool for the given configuration.
 * If pooling is disabled, returns a no-op pool that creates nodes on demand.
 * Otherwise returns the global pool (optionally resized based on config).
 * 
 * @param config - Queue rendering configuration from SSRResult
 * @returns Pool instance to use for node acquisition
 */
export function getPoolForConfig(config?: {
	poolSize?: number;
	disablePooling?: boolean;
}): QueueNodePool {
	// If pooling is disabled (e.g., in SSR), return a no-op pool
	if (config?.disablePooling) {
		return new QueueNodePool(0, false); // Pool size 0 = always create new nodes
	}
	
	// If custom pool size specified, update global pool
	if (config?.poolSize !== undefined && config.poolSize !== globalNodePool.maxSize) {
		return new QueueNodePool(config.poolSize, true);
	}
	
	// Use global pool
	return globalNodePool;
}
