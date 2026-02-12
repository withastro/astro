import type { SSRResult } from '../../../../types/public/internal.js';
import { isPromise } from '../../util.js';
import { isHTMLString, markHTMLString } from '../../escape.js';
import { isAstroComponentFactory, isAPropagatingComponent } from '../astro/factory.js';
import { createAstroComponentInstance, isAstroComponentInstance } from '../astro/instance.js';
import { isRenderInstance } from '../common.js';
import { isRenderInstruction } from '../instruction.js';
import { SlotString } from '../slot.js';
import { getPoolForConfig } from './pool.js';
import type {
	RenderQueue,
	StackItem,
	TextNode,
	HtmlStringNode,
	ComponentNode,
	InstructionNode,
} from './types.js';
import { isRenderTemplateResult } from '../astro/render-template.js';
import { isHeadAndContent } from '../astro/head-and-content.js';

/**
 * Builds a render queue from a component tree.
 * This function traverses the tree depth-first and creates a flat queue
 * of nodes to be rendered, with parent tracking.
 *
 * @param root - The root component/value to render
 * @param result - SSR result context
 * @returns A render queue ready for rendering
 */
export async function buildRenderQueue(root: any, result: SSRResult): Promise<RenderQueue> {
	// Get pool based on config (e.g., disable pooling in SSR)
	const pool = getPoolForConfig(result._experimentalQueuedRenderingConfig);

	const queue: RenderQueue = {
		nodes: [],
		result,
		pool, // Store pool in queue for renderer to release nodes
	};

	// Stack for depth-first traversal (LIFO - Last In, First Out)
	const stack: StackItem[] = [{ node: root, parent: null }];

	// Process nodes depth-first
	while (stack.length > 0) {
		const item = stack.pop()!;
		let { node, parent } = item;

		// Handle promises immediately (wait for resolution)
		if (isPromise(node)) {
			try {
				const resolved = await node;
				// Push resolved value back onto stack
				stack.push({ node: resolved, parent, metadata: item.metadata });
			} catch (error) {
				// Stop on first error as requested
				throw error;
			}
			continue;
		}

		// Skip null, undefined, false (but not 0)
		if (node == null || node === false) {
			continue;
		}

		// Handle different node types
		if (typeof node === 'string') {
			// Plain text content - use content-aware caching
			// acquire('text', ...) returns TextNode, so we can safely assert
			const queueNode = pool.acquire('text', node) as TextNode;
			queueNode.content = node;
			queue.nodes.push(queueNode);
			continue;
		}

		if (typeof node === 'number' || typeof node === 'boolean') {
			// Convert to string - use content-aware caching
			const str = String(node);
			const queueNode = pool.acquire('text', str) as TextNode;
			queueNode.content = str;
			queue.nodes.push(queueNode);
			continue;
		}

		// Handle HTML strings (marked as safe) - use content-aware caching
		if (isHTMLString(node)) {
			const html = node.toString();
			const queueNode = pool.acquire('html-string', html) as HtmlStringNode;
			queueNode.html = html;
			queue.nodes.push(queueNode);
			continue;
		}

		// Handle SlotString - use content-aware caching
		if (node instanceof SlotString) {
			const html = node.toString();
			const queueNode = pool.acquire('html-string', html) as HtmlStringNode;
			queueNode.html = html;
			queue.nodes.push(queueNode);
			continue;
		}

		// Handle arrays
		if (Array.isArray(node)) {
			// Push children onto stack (they'll be popped in reverse, then final queue is reversed)
			for (const n of node) {
				stack.push({ node: n, parent, metadata: item.metadata });
			}
			continue;
		}

		// Handle render instructions (head, hydration scripts, etc.)
		if (isRenderInstruction(node)) {
			const queueNode = pool.acquire('instruction') as InstructionNode;
			queueNode.instruction = node;
			queue.nodes.push(queueNode);
			continue;
		}

		// Handle RenderTemplateResult (Astro template literals)
		if (isRenderTemplateResult(node)) {
			// Process htmlParts and expressions
			// We need to interleave htmlParts with expressions
			const htmlParts = node['htmlParts'];
			const expressions = node['expressions'];

			// Push in forward order - stack pop() will reverse, then final reverse() corrects it
			// Push first html part - mark as HTMLString so it won't be escaped
			if (htmlParts[0]) {
				stack.push({
					node: markHTMLString(htmlParts[0]),
					parent,
					metadata: item.metadata,
				});
			}

			// Interleave expressions and html parts
			for (let i = 0; i < expressions.length; i++) {
				// Push expression
				stack.push({ node: expressions[i], parent, metadata: item.metadata });
				// Push html part after expression - mark as HTMLString
				if (htmlParts[i + 1]) {
					stack.push({
						node: markHTMLString(htmlParts[i + 1]),
						parent,
						metadata: item.metadata,
					});
				}
			}
			continue;
		}

		// Handle Astro component instances
		if (isAstroComponentInstance(node)) {
			// This is already an instance, create queue node
			const queueNode = pool.acquire('component') as ComponentNode;
			queueNode.instance = node;

			// Check if this is a propagator
			// Note: We can't easily check isAPropagatingComponent here because we need the factory
			// This will be handled later when we have access to the factory metadata

			queue.nodes.push(queueNode);

			// We'll need to render this component to get its children
			// For now, we'll handle this in the renderer
			continue;
		}

		// Handle Astro component factories
		if (isAstroComponentFactory(node)) {
			const factory = node;
			const props = item.metadata?.props || {};
			const slots = item.metadata?.slots || {};
			const displayName = item.metadata?.displayName || factory.name || 'Anonymous';

			// Create component instance
			const instance = createAstroComponentInstance(result, displayName, factory, props, slots);

			const queueNode = pool.acquire('component') as ComponentNode;
			queueNode.instance = instance;

			// Check if this component is a propagator (provides head content)
			if (isAPropagatingComponent(result, factory)) {
				// Initialize propagator to collect head content
				try {
					const returnValue = await instance.init(result);
					if (isHeadAndContent(returnValue) && returnValue.head) {
						result._metadata.extraHead.push(returnValue.head);
					}
				} catch (error) {
					// Stop on first error
					throw error;
				}
			}

			queue.nodes.push(queueNode);
			continue;
		}

		// Handle RenderInstance (has a .render() method)
		if (isRenderInstance(node)) {
			// We'll need to render this to get its output
			// For now, treat it as a component-like node
			const queueNode = pool.acquire('component') as ComponentNode;
			queueNode.instance = node as any;
			queue.nodes.push(queueNode);
			continue;
		}

		// Handle iterables (but not strings)
		if (typeof node === 'object' && Symbol.iterator in node) {
			const items = Array.from(node);
			// Push items onto stack in forward order - stack pop() will reverse, then final reverse() corrects it
			for (const iterItem of items) {
				stack.push({ node: iterItem, parent, metadata: item.metadata });
			}
			continue;
		}

		// Handle async iterables
		if (typeof node === 'object' && Symbol.asyncIterator in node) {
			try {
				const items = [];
				for await (const asyncItem of node) {
					items.push(asyncItem);
				}
				// Push items onto stack in forward order - stack pop() will reverse, then final reverse() corrects it
				for (const iterItem of items) {
					stack.push({ node: iterItem, parent, metadata: item.metadata });
				}
			} catch (error) {
				// Stop on first error
				throw error;
			}
			continue;
		}

		// Handle Response objects
		if (node instanceof Response) {
			// Responses can't be rendered in the queue, they need to bubble up
			// We'll create a special node for this
			const queueNode = pool.acquire('html-string', '') as HtmlStringNode;
			queueNode.html = '';
			queue.nodes.push(queueNode);
			continue;
		}

		// Fallback: convert to string - use content-aware caching
		// Check if it's already marked as safe HTML (HTMLString)
		if (isHTMLString(node)) {
			const html = String(node);
			const queueNode = pool.acquire('html-string', html) as HtmlStringNode;
			queueNode.html = html;
			queue.nodes.push(queueNode);
		} else {
			const str = String(node);
			const queueNode = pool.acquire('text', str) as TextNode;
			queueNode.content = str;
			queue.nodes.push(queueNode);
		}
	}

	// Reverse the queue to get correct rendering order
	queue.nodes.reverse();

	return queue;
}
