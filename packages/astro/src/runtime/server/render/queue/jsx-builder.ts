import type { SSRResult } from '../../../../types/public/internal.js';
import type { AstroVNode } from '../../../../jsx-runtime/index.js';
import { isVNode } from '../../../../jsx-runtime/index.js';
import type {
	RenderQueue,
	StackItem,
	TextNode,
	HtmlStringNode,
	QueueNode,
	ComponentNode,
} from './types.js';
import type { NodePool } from './pool.js';
import { HTMLString, markHTMLString, spreadAttributes, voidElementNames } from '../../index.js';
import { isAstroComponentFactory } from '../astro/factory.js';
import { createAstroComponentInstance } from '../astro/instance.js';
import { renderJSX } from '../../jsx.js';
import type { HTMLStringCache } from '../../html-string-cache.js';

const ClientOnlyPlaceholder = 'astro-client-only';

// Stats for tracking JSX queue rendering usage
let jsxQueueStats = {
	vnodeCount: 0,
	elementCount: 0,
	componentCount: 0,
	hasLogged: false,
};

/**
 * Get JSX queue rendering statistics
 */
export function getJSXQueueStats() {
	return { ...jsxQueueStats };
}

/**
 * Reset JSX queue rendering statistics
 */
export function resetJSXQueueStats() {
	jsxQueueStats = {
		vnodeCount: 0,
		elementCount: 0,
		componentCount: 0,
		hasLogged: false,
	};
}

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
export function renderJSXToQueue(
	vnode: any,
	result: SSRResult,
	queue: RenderQueue,
	pool: NodePool,
	stack: StackItem[],
	parent: QueueNode | null,
	metadata?: StackItem['metadata'],
): void {
	// Track that JSX queue rendering is being used
	jsxQueueStats.vnodeCount = jsxQueueStats.vnodeCount + 1;

	// Handle primitive types
	if (vnode instanceof HTMLString) {
		const html = vnode.toString();
		if (html.trim() === '') return;
		const node = pool.acquire('html-string', html) as HtmlStringNode;
		node.html = html;
		queue.nodes.push(node);
		return;
	}

	if (typeof vnode === 'string') {
		const node = pool.acquire('text', vnode) as TextNode;
		node.content = vnode;
		queue.nodes.push(node);
		return;
	}

	if (typeof vnode === 'number' || typeof vnode === 'boolean') {
		const str = String(vnode);
		const node = pool.acquire('text', str) as TextNode;
		node.content = str;
		queue.nodes.push(node);
		return;
	}

	// Handle null, undefined, false (but not 0)
	if (vnode == null || vnode === false) {
		return;
	}

	// Handle arrays - push each item to stack
	if (Array.isArray(vnode)) {
		// Push in reverse order so they're popped in correct order
		for (let i = vnode.length - 1; i >= 0; i = i - 1) {
			stack.push({ node: vnode[i], parent, metadata });
		}
		return;
	}

	// Handle VNodes
	if (!isVNode(vnode)) {
		// Fallback: convert to string
		const str = String(vnode);
		const node = pool.acquire('text', str) as TextNode;
		node.content = str;
		queue.nodes.push(node);
		return;
	}

	// From here, we know it's an AstroVNode
	handleVNode(vnode, result, queue, pool, stack, parent, metadata);
}

function handleVNode(
	vnode: AstroVNode,
	result: SSRResult,
	queue: RenderQueue,
	pool: NodePool,
	stack: StackItem[],
	parent: QueueNode | null,
	metadata?: StackItem['metadata'],
): void {
	// Check for undefined component
	if (!vnode.type) {
		throw new Error(
			`Unable to render ${result.pathname} because it contains an undefined Component!\nDid you forget to import the component or is it possible there is a typo?`,
		);
	}

	// Fragment
	if ((vnode.type as any) === Symbol.for('astro:fragment')) {
		stack.push({ node: vnode.props?.children, parent, metadata });
		return;
	}

	// Astro component factory
	if (isAstroComponentFactory(vnode.type)) {
		jsxQueueStats.componentCount = jsxQueueStats.componentCount + 1;
		const factory = vnode.type;
		let props: Record<string, any> = {};
		let slots: Record<string, any> = {};

		for (const [key, value] of Object.entries(vnode.props ?? {})) {
			if (key === 'children' || (value && typeof value === 'object' && value['$$slot'])) {
				// Slots need to return rendered content
				// We create a function that renders the JSX VNode to string
				slots[key === 'children' ? 'default' : key] = () => renderJSX(result, value);
			} else {
				props[key] = value;
			}
		}

		// Create component instance
		const displayName = metadata?.displayName || factory.name || 'Anonymous';
		const instance = createAstroComponentInstance(result, displayName, factory, props, slots);

		const queueNode = pool.acquire('component') as ComponentNode;
		queueNode.instance = instance;
		queue.nodes.push(queueNode);
		return;
	}

	// HTML element (string type like 'div', 'span')
	if (typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder) {
		jsxQueueStats.elementCount = jsxQueueStats.elementCount + 1;
		renderHTMLElement(vnode, result, queue, pool, stack, parent, metadata);
		return;
	}

	// Function component
	if (typeof vnode.type === 'function') {
		// Check for server:root
		if (vnode.props?.['server:root']) {
			const output = vnode.type(vnode.props ?? {});
			stack.push({ node: output, parent, metadata });
			return;
		}

		// Regular function component - call it and process result
		const output = vnode.type(vnode.props ?? {});
		stack.push({ node: output, parent, metadata });
		return;
	}

	// Client-only placeholder or other component type
	// Fall back to string rendering for complex cases
	// This handles client:only and other edge cases
	const output = renderJSX(result, vnode);
	stack.push({ node: output, parent, metadata });
}

function renderHTMLElement(
	vnode: AstroVNode,
	_result: SSRResult,
	queue: RenderQueue,
	pool: NodePool,
	stack: StackItem[],
	parent: QueueNode | null,
	metadata?: StackItem['metadata'],
): void {
	const tag = vnode.type as string;
	const { children, ...props } = vnode.props ?? {};

	// Pre-render attributes and build complete HTML tag
	const attrs = spreadAttributes(props);

	// Check if void element
	const isVoidElement = (children == null || children === '') && voidElementNames.test(tag);

	if (isVoidElement) {
		// Self-closing element as HTML-string (cached by content)
		const html = `<${tag}${attrs}/>`;
		const node = pool.acquire('html-string', html) as HtmlStringNode;
		node.html = html;
		queue.nodes.push(node);
		return;
	}

	// Non-void element: open tag + children + close tag
	// Build opening tag as HTML-string (cached by content)
	const openTag = `<${tag}${attrs}>`;
	const openTagHtml = queue.htmlStringCache
		? queue.htmlStringCache.getOrCreate(openTag)
		: markHTMLString(openTag);
	stack.push({ node: openTagHtml, parent, metadata });

	// Push children to stack if present
	if (children != null && children !== '') {
		// Prerender element children (handles <script>/<style> special cases)
		const processedChildren = prerenderElementChildren(tag, children, queue.htmlStringCache);
		stack.push({ node: processedChildren, parent, metadata });
	}

	// Create closing tag as HTML-string (cached by content)
	const closeTag = `</${tag}>`;
	const closeTagHtml = queue.htmlStringCache
		? queue.htmlStringCache.getOrCreate(closeTag)
		: markHTMLString(closeTag);
	stack.push({ node: closeTagHtml, parent, metadata });
}

/**
 * Pre-render the children with the given `tag` information
 */
function prerenderElementChildren(
	tag: string,
	children: any,
	htmlStringCache?: HTMLStringCache,
): any {
	// For content within <style> and <script> tags that are plain strings,
	// mark as HTML string to prevent escaping
	if (typeof children === 'string' && (tag === 'style' || tag === 'script')) {
		return htmlStringCache ? htmlStringCache.getOrCreate(children) : markHTMLString(children);
	}
	return children;
}
