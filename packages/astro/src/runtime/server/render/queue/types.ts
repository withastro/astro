import type { SSRResult } from '../../../../types/public/internal.js';
import type { AstroComponentInstance } from '../astro/instance.js';
import type { RenderInstruction } from '../instruction.js';
import type { ServerIslandComponent } from '../server-islands.js';
import type { NodePool } from './pool.js';
import type { HTMLStringCache } from '../../html-string-cache.js';

/**
 * Text node containing plain text content that will be HTML-escaped during rendering
 */
export interface TextNode {
	type: 'text';
	content: string;
}

/**
 * HTML string node containing pre-rendered HTML markup that is already safe
 */
export interface HtmlStringNode {
	type: 'html-string';
	html: string;
}

/**
 * Component node containing an Astro component instance to be rendered
 */
export interface ComponentNode {
	type: 'component';
	instance: AstroComponentInstance | ServerIslandComponent;
}

/**
 * Instruction node containing rendering instructions (head content, hydration scripts, etc.)
 */
export interface InstructionNode {
	type: 'instruction';
	instruction: RenderInstruction;
}

/**
 * Discriminated union of all queue node types.
 * TypeScript will narrow the type based on the 'type' field.
 */
export type QueueNode = TextNode | HtmlStringNode | ComponentNode | InstructionNode;

/**
 * The render queue containing all nodes to be rendered
 */
export interface RenderQueue {
	/**
	 * All nodes in rendering order (after reversing the built queue)
	 */
	nodes: QueueNode[];

	/**
	 * SSRResult context
	 */
	result: SSRResult;

	/**
	 * Object pool instance used for node acquisition
	 */
	pool?: NodePool;

	/**
	 * HTMLString cache instance for reducing memory allocations
	 */
	htmlStringCache?: HTMLStringCache;
}

/**
 * Stack item used during queue building (internal use only)
 */
export interface StackItem {
	/**
	 * The value to process
	 */
	node: any;

	/**
	 * Parent queue node (tracked but not used during rendering)
	 */
	parent: QueueNode | null;

	/**
	 * Additional metadata passed through the stack (component props, slots, displayName)
	 */
	metadata?: {
		displayName?: string;
		props?: Record<string, any>;
		slots?: any;
	};
}
