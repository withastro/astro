import { queuePoolSize } from '../../../../core/app/manifest.js';
class NodePool {
	textPool = [];
	htmlStringPool = [];
	componentPool = [];
	instructionPool = [];
	maxSize;
	enableStats;
	stats = {
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
	constructor(maxSize = 1e3, enableStats = false) {
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
	acquire(type, content) {
		const pooledNode = this.popFromTypedPool(type);
		if (pooledNode) {
			if (this.enableStats) {
				this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
			}
			this.resetNodeContent(pooledNode, type, content);
			return pooledNode;
		}
		if (this.enableStats) {
			this.stats.acquireNew = this.stats.acquireNew + 1;
		}
		return this.createNode(type, content);
	}
	/**
	 * Creates a new node of the specified type with the given content.
	 * Helper method to reduce branching in acquire().
	 */
	createNode(type, content = '') {
		switch (type) {
			case 'text':
				return { type: 'text', content };
			case 'html-string':
				return { type: 'html-string', html: content };
			case 'component':
				return { type: 'component', instance: void 0 };
			case 'instruction':
				return { type: 'instruction', instruction: void 0 };
		}
	}
	/**
	 * Pops a node from the type-specific sub-pool.
	 * Returns undefined if the sub-pool for the requested type is empty.
	 */
	popFromTypedPool(type) {
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
	resetNodeContent(node, type, content) {
		switch (type) {
			case 'text':
				node.content = content ?? '';
				break;
			case 'html-string':
				node.html = content ?? '';
				break;
			case 'component':
				node.instance = void 0;
				break;
			case 'instruction':
				node.instruction = void 0;
				break;
		}
	}
	/**
	 * Returns the total number of nodes across all typed sub-pools.
	 */
	totalPoolSize() {
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
	release(node) {
		if (this.totalPoolSize() >= this.maxSize) {
			if (this.enableStats) {
				this.stats.releasedDropped = this.stats.releasedDropped + 1;
			}
			return;
		}
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
				node.instance = void 0;
				this.componentPool.push(node);
				break;
			case 'instruction':
				node.instruction = void 0;
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
	releaseAll(nodes) {
		for (const node of nodes) {
			this.release(node);
		}
	}
	/**
	 * Clears all typed sub-pools, discarding all cached nodes.
	 * This can be useful if you want to free memory after a large render.
	 */
	clear() {
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
	size() {
		return this.totalPoolSize();
	}
	/**
	 * Gets pool statistics for debugging.
	 *
	 * @returns Pool usage statistics including computed metrics
	 */
	getStats() {
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
function newNodePool(config) {
	const poolSize = queuePoolSize(config);
	return new NodePool(poolSize);
}
export { NodePool, newNodePool };
