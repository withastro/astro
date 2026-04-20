const FORBIDDEN_PATH_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export default function dlv(obj: Record<string, unknown>, key: string): any {
	for (const k of key.split('.')) {
		if (FORBIDDEN_PATH_KEYS.has(k) || !obj || typeof obj !== 'object' || !Object.hasOwn(obj, k)) {
			return undefined;
		}
		// @ts-expect-error: Type 'unknown' is not assignable to type 'Record<string, unknown>'.
		obj = obj[k];
	}
	return obj;
}
