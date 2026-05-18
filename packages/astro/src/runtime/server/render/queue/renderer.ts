import type { SSRResult } from '../../../../types/public/internal.js';
import { markHTMLString, escapeHTML } from '../../escape.js';
import { chunkToString, type RenderDestination } from '../common.js';
import type { QueueNode, RenderQueue } from './types.js';

/**
 * Renders a queue of nodes to a destination.
 * This function processes nodes sequentially with batching optimization.
 * Consecutive batchable nodes (text, HTML-string, simple elements) are
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
	const cache = queue.htmlStringCache;
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
					batchBuffer += renderNodeToString(queue.nodes[i]);
					i = i + 1;
				}

				// Flush accumulated batch
				if (batchBuffer) {
					const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
					destination.write(htmlString);
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

				i = i + 1;
			}
		} catch (error) {
			// Stop on first error as requested
			throw error;
		}
	}

	// Flush any remaining batched content (shouldn't happen but safety check)
	if (batchBuffer) {
		const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
		destination.write(htmlString);
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
function renderNodeToString(node: QueueNode): string {
	switch (node.type) {
		case 'text':
			return node.content ? escapeHTML(node.content) : '';

		case 'html-string':
			return node.html || '';

		case 'component':
		case 'instruction': {
			return '';
		}
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
	const cache = result._experimentalQueuedRendering?.htmlStringCache;

	switch (node.type) {
		case 'text': {
			// Escape HTML in plain text
			if (node.content) {
				const escaped = escapeHTML(node.content);
				const htmlString = cache ? cache.getOrCreate(escaped) : markHTMLString(escaped);
				destination.write(htmlString);
			}
			break;
		}

		case 'html-string': {
			// Already safe HTML, write directly
			if (node.html) {
				const htmlString = cache ? cache.getOrCreate(node.html) : markHTMLString(node.html);
				destination.write(htmlString);
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
	}
}
