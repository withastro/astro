import type { SSRResult } from '../../../../types/public/internal.js';
import type { AstroComponentInstance } from '../astro/instance.js';
import type { AstroComponentFactory } from '../astro/factory.js';
import type { RenderInstruction } from '../instruction.js';
import type { ServerIslandComponent } from '../server-islands.js';

/**
 * Represents a node in the render queue.
 * Each node knows its type, parent, and relevant data for rendering.
 */
export interface QueueNode {
	/**
	 * The type of node determines how it will be rendered
	 */
	type:
		| 'element' // HTML element like <div>, <span>
		| 'text' // Plain text content
		| 'component' // Astro component
		| 'fragment' // Fragment (no wrapper)
		| 'instruction' // Render instruction (head, hydration, etc)
		| 'slot' // Slot content
		| 'html-string' // Pre-rendered HTML string
		| 'async-boundary'; // Async component boundary

	/**
	 * Parent node for tracking nesting relationships.
	 * Used to properly close tags and maintain structure.
	 */
	parent?: QueueNode;

	/**
	 * Children nodes (for elements that have children)
	 */
	children?: QueueNode[];

	// ============ Element-specific fields ============
	/**
	 * HTML tag name (for type: 'element')
	 */
	tagName?: string;

	/**
	 * Element attributes/props (for type: 'element')
	 */
	props?: Record<string, any>;

	/**
	 * Whether this element has children that need to be rendered
	 */
	hasChildren?: boolean;

	// ============ Component-specific fields ============
	/**
	 * Component factory (for type: 'component')
	 */
	factory?: AstroComponentFactory;

	/**
	 * Component instance (for type: 'component')
	 */
	instance?: AstroComponentInstance | ServerIslandComponent;

	/**
	 * Whether this component is a propagator (needs head content)
	 */
	isPropagator?: boolean;

	/**
	 * Display name for debugging
	 */
	displayName?: string;

	// ============ Async-specific fields ============
	/**
	 * Promise to resolve (for type: 'async-boundary')
	 */
	promise?: Promise<any>;

	/**
	 * Whether the async node has been resolved
	 */
	resolved?: boolean;

	/**
	 * Resolved value from the promise
	 */
	resolvedValue?: any;

	// ============ Content fields ============
	/**
	 * Text content (for type: 'text')
	 */
	content?: string;

	/**
	 * Pre-rendered HTML (for type: 'html-string')
	 */
	html?: string;

	/**
	 * Render instruction (for type: 'instruction')
	 */
	instruction?: RenderInstruction;

	/**
	 * Slot name (for type: 'slot')
	 */
	slotName?: string;

	/**
	 * Slot function (for type: 'slot')
	 */
	slotFn?: (result: SSRResult) => any;

	// ============ Metadata ============
	/**
	 * Original value that created this node (for debugging)
	 */
	originalValue?: any;

	/**
	 * Position in the queue (for debugging and error reporting)
	 */
	position?: number;
}

/**
 * The render queue containing all nodes to be rendered
 */
export interface RenderQueue {
	/**
	 * All nodes in rendering order (after reversing the built queue)
	 */
	nodes: QueueNode[];

	/**
	 * Async boundaries that need to be resolved before rendering
	 */
	asyncBoundaries: QueueNode[];

	/**
	 * Propagator components that provide head content
	 */
	propagators: QueueNode[];

	/**
	 * Whether the queue contains any async operations
	 */
	hasAsync: boolean;

	/**
	 * SSRResult context
	 */
	result: SSRResult;
	
	/**
	 * Object pool instance used for node acquisition
	 */
	pool?: import('./pool.js').QueueNodePool;
}

/**
 * Stack item used during queue building
 */
export interface StackItem {
	/**
	 * The value to process
	 */
	node: any;

	/**
	 * Parent queue node
	 */
	parent: QueueNode | null;

	/**
	 * Additional metadata for processing
	 */
	metadata?: {
		displayName?: string;
		props?: Record<string, any>;
		slots?: any;
	};
}
