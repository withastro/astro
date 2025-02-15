import deepDiff from "deep-diff";

export function getAdded<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const added: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		if (!(key in oldObj)) added[key] = value;
	}
	return added;
}

export function getDropped<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const dropped: Record<string, T> = {};
	for (const [key, value] of Object.entries(oldObj)) {
		if (!(key in newObj)) dropped[key] = value;
	}
	return dropped;
}

export function getUpdated<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const updated: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		const oldValue = oldObj[key];
		if (!oldValue) continue;
		if (deepDiff(oldValue, value)) updated[key] = value;
	}
	return updated;
}
