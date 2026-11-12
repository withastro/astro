import { encodeHexLowerCase } from '@oslojs/encoding';
import type { AstroConfig } from '../../../types/public/config.js';
import { getConfigHashInput } from './input.js';

export { getConfigHashInput } from './input.js';

/**
 * Serialize a value with object keys sorted recursively, so that a change in key
 * order does not change the result. Array order is preserved because it is
 * meaningful (e.g. `i18n.locales`, `redirects`). Function and `undefined` values
 * are dropped by `JSON.stringify`, which is what lets us hand whole config
 * objects (like `markdown` or `image`) to {@link getConfigHashInput} and let
 * their non-serializable pockets fall away.
 */
function stableStringify(value: unknown): string {
	return JSON.stringify(value, (_key, val) => {
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			return Object.keys(val)
				.sort()
				.reduce<Record<string, unknown>>((acc, key) => {
					acc[key] = (val as Record<string, unknown>)[key];
					return acc;
				}, {});
		}
		return val;
	});
}

/**
 * Produce a sha256 over the output-affecting subset of the resolved config (see
 * {@link getConfigHashInput}). A mismatch invalidates the whole incremental
 * build cache.
 */
export async function computeConfigHash(config: AstroConfig): Promise<string> {
	const input = stableStringify(getConfigHashInput(config));
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return encodeHexLowerCase(new Uint8Array(digest));
}
