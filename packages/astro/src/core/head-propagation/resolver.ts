import type { PropagationHint, SSRResult } from '../../types/public/internal.js';

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

export function isPropagatingHint(hint: PropagationHint): boolean {
	return hint === 'self' || hint === 'in-tree';
}

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
