import { createHash } from 'node:crypto';

export function arraysEqual(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}
	return left.every((value, index) => value === right[index]);
}

export function appendDirectoryUrl(directory: URL | string): URL {
	const value = typeof directory === 'string' ? directory : directory.toString();
	return new URL(value.endsWith('/') ? value : `${value}/`);
}

export function createDigest(value: unknown): string {
	const serialized = JSON.stringify(normalizeDigestValue(value, new WeakSet<object>()));
	return createHash('sha256').update(serialized).digest('hex');
}

function normalizeDigestValue(value: unknown, seen: WeakSet<object>): unknown {
	if (
		value === null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (typeof value === 'symbol') {
		return value.description ?? '';
	}
	if (typeof value === 'function') {
		return `[Function:${value.name || 'anonymous'}]`;
	}
	if (value instanceof URL || value instanceof Date || value instanceof RegExp) {
		return value.toString();
	}
	if (Array.isArray(value)) {
		return value.map((entry) => normalizeDigestValue(entry, seen));
	}
	if (value instanceof Map) {
		return Array.from(value.entries())
			.map(([key, entryValue]) => [
				normalizeDigestValue(key, seen),
				normalizeDigestValue(entryValue, seen),
			])
			.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
	}
	if (value instanceof Set) {
		return Array.from(value.values())
			.map((entry) => normalizeDigestValue(entry, seen))
			.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
	}
	if (value && typeof value === 'object') {
		if (seen.has(value)) {
			return '[Circular]';
		}
		seen.add(value);
		const normalized = Object.fromEntries(
			Object.entries(value)
				.filter(([, entryValue]) => entryValue !== undefined)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, entryValue]) => [key, normalizeDigestValue(entryValue, seen)]),
		);
		seen.delete(value);
		return normalized;
	}
	return String(value);
}

export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
