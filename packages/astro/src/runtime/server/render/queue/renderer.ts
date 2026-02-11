import type { SSRResult } from '../../../../types/public/internal.js';
import { markHTMLString, escapeHTML } from '../../escape.js';
import { chunkToString, type RenderDestination } from '../common.js';
import type { QueueNode, RenderQueue } from './types.js';

/**
 * Renders a queue of nodes to a destination.
 * This function processes nodes sequentially and writes output immediately
 * to maintain streaming behavior.
 *
 * @param queue - The render queue to process
 * @param destination - Where to write the output
 */
export async function renderQueue(
	queue: RenderQueue,
	destination: RenderDestination,
): Promise<void> {
	const result = queue.result;

	for (const node of queue.nodes) {
		try {
			await renderNode(node, destination, result);
		} catch (error) {
			// Stop on first error as requested
			throw error;
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

		case 'element': {
			// Render HTML element
			if (node.tagName) {
				if (node.hasChildren) {
					// Opening tag for element with children
					const attrs = renderAttributes(node.props || {});
					destination.write(markHTMLString(`<${node.tagName}${attrs}>`));
				} else {
					// Self-closing or element with text content
					const attrs = renderAttributes(node.props || {});
					const content = node.content || '';
					destination.write(
						markHTMLString(`<${node.tagName}${attrs}>${content}</${node.tagName}>`),
					);
				}
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

/**
 * Renders HTML attributes from a props object
 */
function renderAttributes(props: Record<string, any>): string {
	const attrs: string[] = [];

	for (const [key, value] of Object.entries(props)) {
		if (value == null || value === false) {
			continue;
		}

		// Boolean attributes
		if (value === true) {
			attrs.push(key);
			continue;
		}

		// Regular attributes
		const escapedValue = String(value)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		attrs.push(`${key}="${escapedValue}"`);
	}

	return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}
