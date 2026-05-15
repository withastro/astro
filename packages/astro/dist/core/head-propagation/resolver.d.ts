import type { PropagationHint, SSRResult } from '../../types/public/internal.js';
/**
 * Resolves the effective propagation hint for a component.
 *
 * Priority: explicit factory hint -> component metadata -> `none`.
 *
 * @example
 * A runtime-created head entry uses `propagation: 'self'`, so it propagates
 * even when metadata says `none`.
 */
export declare function resolvePropagationHint(input: {
	factoryHint: PropagationHint | undefined;
	moduleId: string | undefined;
	metadataLookup: (moduleId: string) => PropagationHint | undefined;
}): PropagationHint;
/** Returns true when a hint should register a component as a propagator. */
export declare function isPropagatingHint(hint: PropagationHint): boolean;
/**
 * Reads propagation metadata from an `SSRResult` + component factory.
 *
 * @example
 * A compiled `.astro` module with metadata `in-tree` is treated as propagating
 * when the factory does not set a stronger explicit hint.
 */
export declare function getPropagationHint(
	result: SSRResult,
	factory: {
		propagation?: PropagationHint;
		moduleId?: string | undefined;
	},
): PropagationHint;
