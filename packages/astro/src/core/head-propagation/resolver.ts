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
export function resolvePropagationHint(input: {
	factoryHint: PropagationHint | undefined;
	moduleId: string | undefined;
	metadataLookup: (moduleId: string) => PropagationHint | undefined;
}): PropagationHint {
	const explicitHint = input.factoryHint ?? 'none';
	if (explicitHint !== 'none') {
		return explicitHint;
	}

	if (!input.moduleId) {
		return 'none';
	}

	return input.metadataLookup(input.moduleId) ?? 'none';
}

/** Returns true when a hint should register a component as a propagator. */
export function isPropagatingHint(hint: PropagationHint): boolean {
	return hint === 'self' || hint === 'in-tree';
}

/**
 * Reads propagation metadata from an `SSRResult` + component factory.
 *
 * @example
 * A compiled `.astro` module with metadata `in-tree` is treated as propagating
 * when the factory does not set a stronger explicit hint.
 */
export function getPropagationHint(
	result: SSRResult,
	factory: { propagation?: PropagationHint; moduleId?: string | undefined },
): PropagationHint {
	return resolvePropagationHint({
		factoryHint: factory.propagation,
		moduleId: factory.moduleId,
		metadataLookup: (moduleId) => result.componentMetadata.get(moduleId)?.propagation,
	});
}
