function resolvePropagationHint(input) {
	const explicitHint = input.factoryHint ?? 'none';
	if (explicitHint !== 'none') {
		return explicitHint;
	}
	if (!input.moduleId) {
		return 'none';
	}
	return input.metadataLookup(input.moduleId) ?? 'none';
}
function isPropagatingHint(hint) {
	return hint === 'self' || hint === 'in-tree';
}
function getPropagationHint(result, factory) {
	return resolvePropagationHint({
		factoryHint: factory.propagation,
		moduleId: factory.moduleId,
		metadataLookup: (moduleId) => result.componentMetadata.get(moduleId)?.propagation,
	});
}
export { getPropagationHint, isPropagatingHint, resolvePropagationHint };
