import type { SSRResult } from '../../../../types/public/internal.js';
import type { RenderQueue, StackItem, QueueNode } from './types.js';
import type { NodePool } from './pool.js';
/**
 * Get JSX queue rendering statistics
 */
export declare function getJSXQueueStats(): {
	vnodeCount: number;
	elementCount: number;
	componentCount: number;
	hasLogged: boolean;
};
/**
 * Reset JSX queue rendering statistics
 */
export declare function resetJSXQueueStats(): void;
/**
 * Processes JSX VNodes and adds them to the render queue.
 * Unlike renderJSX(), this doesn't build strings recursively -
 * it pushes nodes directly to the queue for batching and memory efficiency.
 *
 * This function handles JSX created by astro:jsx (JSX in .astro files).
 * It converts VNodes to queue nodes, enabling content-aware pooling and batching.
 *
 * @param vnode - JSX VNode to process
 * @param result - SSR result context
 * @param queue - Queue to append nodes to
 * @param pool - Node pool for memory efficiency
 * @param stack - Stack for depth-first traversal
 * @param parent - Parent queue node (for tracking)
 * @param metadata - Metadata passed through stack (props, slots, displayName)
 */
export declare function renderJSXToQueue(
	vnode: any,
	result: SSRResult,
	queue: RenderQueue,
	pool: NodePool,
	stack: StackItem[],
	parent: QueueNode | null,
	metadata?: StackItem['metadata'],
): void;
