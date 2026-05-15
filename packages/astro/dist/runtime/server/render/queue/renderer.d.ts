import { type RenderDestination } from '../common.js';
import type { RenderQueue } from './types.js';
/**
 * Renders a queue of nodes to a destination.
 * This function processes nodes sequentially with batching optimization.
 * Consecutive batchable nodes (text, HTML-string, simple elements) are
 * combined into a single write to reduce overhead.
 *
 * @param queue - The render queue to process
 * @param destination - Where to write the output
 */
export declare function renderQueue(
	queue: RenderQueue,
	destination: RenderDestination,
): Promise<void>;
