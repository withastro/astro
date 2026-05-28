import type {
	QueueNode,
	TextNode,
	HtmlStringNode,
	ComponentNode,
	InstructionNode,
} from './types.js';
import type { SSRManifest } from '../../../../core/app/types.js';
import { queuePoolSize } from '../../../../core/app/manifest.js';

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
export class NodePool {
	private textPool: TextNode[] = [];
	private htmlStringPool: HtmlStringNode[] = [];
	private componentPool: ComponentNode[] = [];
	private instructionPool: InstructionNode[] = [];
	public readonly maxSize: number;
	private readonly enableStats: boolean;
	private stats: PoolStats = {
		acquireFromPool: 0,
		acquireNew: 0,
		released: 0,
		releasedDropped: 0,
	};

	/**
	 * Creates a new object pool for queue nodes.
	 *
	 * @param maxSize - Maximum number of nodes to keep in the pool (default: 1000).
	 *   The cap is shared across all typed sub-pools.
	 * @param enableStats - Enable statistics tracking (default: false for performance)
	 */
	constructor(maxSize = 1000, enableStats = false) {
		this.maxSize = maxSize;
		this.enableStats = enableStats;
	}

	/**
	 * Acquires a queue node from the pool or creates a new one if the pool is empty.
	 * Pops from the type-specific sub-pool to reuse an existing object when available.
	 *
	 * @param type - The type of queue node to acquire
	 * @param content - Optional content to set on the node (for text or html-string types)
	 * @returns A queue node ready to be populated with data
	 */
	acquire(type: QueueNode['type'], content?: string): QueueNode {
		// Pop from the type-specific sub-pool and reuse the object
		const pooledNode = this.popFromTypedPool(type);

		if (pooledNode) {
			if (this.enableStats) {
				this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
			}
			// Reassign value field on the reused object (type discriminant is already correct)
			this.resetNodeContent(pooledNode, type, content);
			return pooledNode;
		}

		// Pool is empty for this type, create new node
		if (this.enableStats) {
			this.stats.acquireNew = this.stats.acquireNew + 1;
		}

		return this.createNode(type, content);
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
	 * Pops a node from the type-specific sub-pool.
	 * Returns undefined if the sub-pool for the requested type is empty.
	 */
	private popFromTypedPool(type: QueueNode['type']): QueueNode | undefined {
		switch (type) {
			case 'text':
				return this.textPool.pop();
			case 'html-string':
				return this.htmlStringPool.pop();
			case 'component':
				return this.componentPool.pop();
			case 'instruction':
				return this.instructionPool.pop();
		}
	}

	/**
	 * Resets the content/value field on a reused pooled node.
	 * The type discriminant is already correct since we pop from the matching sub-pool.
	 */
	private resetNodeContent(node: QueueNode, type: QueueNode['type'], content?: string): void {
		switch (type) {
			case 'text':
				(node as TextNode).content = content ?? '';
				break;
			case 'html-string':
				(node as HtmlStringNode).html = content ?? '';
				break;
			case 'component':
				(node as ComponentNode).instance = undefined as any;
				break;
			case 'instruction':
				(node as InstructionNode).instruction = undefined as any;
				break;
		}
	}

	/**
	 * Returns the total number of nodes across all typed sub-pools.
	 */
	private totalPoolSize(): number {
		return (
			this.textPool.length +
			this.htmlStringPool.length +
			this.componentPool.length +
			this.instructionPool.length
		);
	}

	/**
	 * Releases a queue node back to the pool for reuse.
	 * If the pool is at max capacity, the node is discarded (will be GC'd).
	 *
	 * @param node - The node to release back to the pool
	 */
	release(node: QueueNode): void {
		if (this.totalPoolSize() >= this.maxSize) {
			if (this.enableStats) {
				this.stats.releasedDropped = this.stats.releasedDropped + 1;
			}
			// Pool is full, let the node be garbage collected
			return;
		}

		// Route to the correct typed sub-pool and clear value fields
		// to avoid retaining references across renders
		switch (node.type) {
			case 'text':
				node.content = '';
				this.textPool.push(node);
				break;
			case 'html-string':
				node.html = '';
				this.htmlStringPool.push(node);
				break;
			case 'component':
				node.instance = undefined as any;
				this.componentPool.push(node);
				break;
			case 'instruction':
				node.instruction = undefined as any;
				this.instructionPool.push(node);
				break;
		}

		if (this.enableStats) {
			this.stats.released = this.stats.released + 1;
		}
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
	 * Clears all typed sub-pools, discarding all cached nodes.
	 * This can be useful if you want to free memory after a large render.
	 */
	clear(): void {
		this.textPool.length = 0;
		this.htmlStringPool.length = 0;
		this.componentPool.length = 0;
		this.instructionPool.length = 0;
	}

	/**
	 * Gets the current total number of nodes across all typed sub-pools.
	 * Useful for monitoring pool usage and tuning maxSize.
	 *
	 * @returns Number of nodes currently available in the pool
	 */
	size(): number {
		return this.totalPoolSize();
	}

	/**
	 * Gets pool statistics for debugging.
	 *
	 * @returns Pool usage statistics including computed metrics
	 */
	getStats(): PoolStatsReport {
		return {
			...this.stats,
			poolSize: this.totalPoolSize(),
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
 * Returns an instance of the `NodePool` based on its configuration.
 * @param config - The queued rendering configuration from the SSR manifest
 */
export function newNodePool(
	config: NonNullable<SSRManifest['experimentalQueuedRendering']>,
): NodePool {
	const poolSize = queuePoolSize(config);
	return new NodePool(poolSize);
}
