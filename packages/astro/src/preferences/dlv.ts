import { FORBIDDEN_PATH_KEYS } from '@astrojs/internal-helpers/object';

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
