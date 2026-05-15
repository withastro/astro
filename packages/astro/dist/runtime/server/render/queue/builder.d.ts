import type { SSRResult } from '../../../../types/public/internal.js';
import type { RenderQueue } from './types.js';
import type { NodePool } from './pool.js';
/**
 * Builds a render queue from a component tree.
 * This function traverses the tree depth-first and creates a flat queue
 * of nodes to be rendered, with parent tracking.
 *
 * @param root - The root component/value to render
 * @param result - SSR result context
 * @param pool
 * @returns A render queue ready for rendering
 */
export declare function buildRenderQueue(
	root: any,
	result: SSRResult,
	pool: NodePool,
): Promise<RenderQueue>;
