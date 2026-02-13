const storeCache = new Map();

export function defineStore(name, value) {
	const cached = storeCache.get(name);
	if (cached) return cached;
	const store = { value };
	storeCache.set(name, store);
	return store;
}
