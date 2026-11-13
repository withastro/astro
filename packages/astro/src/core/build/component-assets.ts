export function getComponentAssetOrder(
	ids: Iterable<string>,
	getDependencies: (id: string) => Iterable<string>,
): Map<string, number> {
	const order = new Map<string, number>();
	const seen = new Set<string>();
	function visit(id: string) {
		if (seen.has(id)) return;
		seen.add(id);
		for (const dependency of getDependencies(id)) visit(dependency);
		order.set(id, order.size);
	}
	for (const id of ids) visit(id);
	return order;
}
