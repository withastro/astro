function routeComparator(a, b) {
	const commonLength = Math.min(a.segments.length, b.segments.length);
	for (let index = 0; index < commonLength; index++) {
		const aSegment = a.segments[index];
		const bSegment = b.segments[index];
		const aIsStatic = aSegment.every((part) => !part.dynamic && !part.spread);
		const bIsStatic = bSegment.every((part) => !part.dynamic && !part.spread);
		if (aIsStatic && bIsStatic) {
			const aContent = aSegment.map((part) => part.content).join('');
			const bContent = bSegment.map((part) => part.content).join('');
			if (aContent !== bContent) {
				return aContent.localeCompare(bContent);
			}
		}
		if (aIsStatic !== bIsStatic) {
			return aIsStatic ? -1 : 1;
		}
		const aAllDynamic = aSegment.every((part) => part.dynamic);
		const bAllDynamic = bSegment.every((part) => part.dynamic);
		if (aAllDynamic !== bAllDynamic) {
			return aAllDynamic ? 1 : -1;
		}
		const aHasSpread = aSegment.some((part) => part.spread);
		const bHasSpread = bSegment.some((part) => part.spread);
		if (aHasSpread !== bHasSpread) {
			return aHasSpread ? 1 : -1;
		}
	}
	const aLength = a.segments.length;
	const bLength = b.segments.length;
	if (aLength !== bLength) {
		const aEndsInRest = a.segments.at(-1)?.some((part) => part.spread);
		const bEndsInRest = b.segments.at(-1)?.some((part) => part.spread);
		if (aEndsInRest !== bEndsInRest && Math.abs(aLength - bLength) === 1) {
			if (aLength > bLength && aEndsInRest) {
				return 1;
			}
			if (bLength > aLength && bEndsInRest) {
				return -1;
			}
		}
		return aLength > bLength ? -1 : 1;
	}
	if ((a.type === 'endpoint') !== (b.type === 'endpoint')) {
		return a.type === 'endpoint' ? -1 : 1;
	}
	return a.route.localeCompare(b.route);
}
export { routeComparator };
