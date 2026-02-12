import type { SSRResult } from '../../../../types/public/internal.js';
import { markHTMLString, escapeHTML } from '../../escape.js';
import { chunkToString, type RenderDestination } from '../common.js';
import type { QueueNode, RenderQueue } from './types.js';

/**
 * Renders a queue of nodes to a destination.
 * This function processes nodes sequentially with batching optimization.
 * Consecutive batchable nodes (text, html-string, simple elements) are
 * combined into a single write to reduce overhead.
 *
 * @param queue - The render queue to process
 * @param destination - Where to write the output
 */
export async function renderQueue(
	queue: RenderQueue,
	destination: RenderDestination,
): Promise<void> {
	const result = queue.result;
	const pool = queue.pool;
	let batchBuffer = '';
	let i = 0;

	while (i < queue.nodes.length) {
		const node = queue.nodes[i];

		try {
			// Check if this node can be batched
			if (canBatch(node)) {
				// Accumulate consecutive batchable content
				const batchStart = i;
				while (i < queue.nodes.length && canBatch(queue.nodes[i])) {
					batchBuffer += renderNodeToString(queue.nodes[i], result);
					i++;
				}

				// Flush accumulated batch
				if (batchBuffer) {
					destination.write(markHTMLString(batchBuffer));
					batchBuffer = '';
				}

				// Release batched nodes immediately (enables intra-page pooling)
				if (pool) {
					for (let j = batchStart; j < i; j++) {
						pool.release(queue.nodes[j]);
					}
				}
			} else {
				// Non-batchable node (component, instruction, etc.)
				// Render it individually to maintain correct streaming behavior
				await renderNode(node, destination, result);

				// Release node immediately after rendering (enables intra-page pooling)
				if (pool) {
					pool.release(node);
				}

				i++;
			}
		} catch (error) {
			// Stop on first error as requested
			throw error;
		}
	}

	// Flush any remaining batched content (shouldn't happen but safety check)
	if (batchBuffer) {
		destination.write(markHTMLString(batchBuffer));
	}
}

/**
 * Determines if a node can be batched with adjacent nodes.
 * Batchable nodes are those that can be rendered synchronously to a string
 * without requiring async operations or special handling.
 */
function canBatch(node: QueueNode): boolean {
	return node.type === 'text' || node.type === 'html-string';
}

/**
 * Renders a batchable node to a string (synchronous).
 * Only call this for nodes where canBatch() returns true.
 */
function renderNodeToString(node: QueueNode, _result: SSRResult): string {
	switch (node.type) {
		case 'text':
			return node.content ? escapeHTML(node.content) : '';

		case 'html-string':
			return node.html || '';

		default:
			return '';
	}
}

/**
 * Renders a single queue node
 */
async function renderNode(
	node: QueueNode,
	destination: RenderDestination,
	result: SSRResult,
): Promise<void> {
	switch (node.type) {
		case 'text': {
			// Escape HTML in plain text
			if (node.content) {
				destination.write(markHTMLString(escapeHTML(node.content)));
			}
			break;
		}

		case 'html-string': {
			// Already safe HTML, write directly
			if (node.html) {
				destination.write(markHTMLString(node.html));
			}
			break;
		}

		case 'instruction': {
			// Render instructions (head content, hydration scripts, etc.)
			if (node.instruction) {
				destination.write(node.instruction);
			}
			break;
		}

		case 'component': {
			// Render component
			if (node.instance) {
				// Create a buffer to capture component output
				let componentHtml = '';
				const componentDestination: RenderDestination = {
					write(chunk) {
						// Ignore Response objects (can't be rendered in string context)
						if (chunk instanceof Response) return;
						componentHtml += chunkToString(result, chunk);
					},
				};

				// Render the component
				await node.instance.render(componentDestination);

				// Write captured output
				if (componentHtml) {
					destination.write(componentHtml);
				}
			}
			break;
		}

		case 'fragment': {
			// Fragments don't render anything themselves
			// Their children are rendered separately
			break;
		}

		case 'slot': {
			// Render slot content
			if (node.slotFn) {
				const slotContent = await node.slotFn(result);
				// Process the slot content
				if (slotContent) {
					destination.write(markHTMLString(String(slotContent)));
				}
			}
			break;
		}

		case 'async-boundary': {
			// This should have been resolved during queue building
			if (!node.resolved && node.promise) {
				// Fallback: resolve now if somehow not resolved
				const resolved = await node.promise;
				destination.write(markHTMLString(String(resolved)));
			} else if (node.resolvedValue) {
				destination.write(markHTMLString(String(node.resolvedValue)));
			}
			break;
		}

		default: {
			// Unknown node type - try to convert to string
			console.warn(`[queue-renderer] Unknown node type: ${node.type}`);
			if (node.originalValue != null) {
				destination.write(markHTMLString(String(node.originalValue)));
			}
			break;
		}
	}
}
