import type { SSRManifest } from '../app/types.js';

/**
 * Shared helpers for "derived once per process per manifest" memoization.
 * Manifest-keyed WeakMaps are the sanctioned memoization primitive of the
 * request core: each derivation lives in its owning module with its own memo —
 * there is deliberately no central registry and no "get all derived state"
 * function anywhere.
 *
 * Note: values are scoped per manifest OBJECT. Two `App`s constructed over the
 * same manifest object (e.g. the cloudflare custom-fetch worker) share every
 * memoized derivation.
 */

export interface ManifestMemo<T> {
	get(manifest: SSRManifest): T;
	/** Whether a value is currently stored for the manifest (derived or set). */
	has(manifest: SSRManifest): boolean;
	/** Replaces the stored value atomically (HMR replacement). */
	set(manifest: SSRManifest, value: T): void;
	invalidate(manifest: SSRManifest): void;
}

export function createManifestMemo<T>(derive: (manifest: SSRManifest) => T): ManifestMemo<T> {
	const cache = new WeakMap<SSRManifest, T>();
	return {
		get(manifest) {
			// `has` rather than `get ?? compute` so derivations that legitimately
			// produce `undefined` (e.g. `getSite` without a configured site) are
			// still cached.
			if (cache.has(manifest)) {
				return cache.get(manifest) as T;
			}
			const value = derive(manifest);
			cache.set(manifest, value);
			return value;
		},
		has(manifest) {
			return cache.has(manifest);
		},
		set(manifest, value) {
			cache.set(manifest, value);
		},
		invalidate(manifest) {
			cache.delete(manifest);
		},
	};
}

export interface AsyncManifestMemo<T> {
	get(manifest: SSRManifest): Promise<T>;
	invalidate(manifest: SSRManifest): void;
}

/**
 * Caches the PROMISE (single-flight: concurrent callers share one derivation).
 * On rejection the entry is DELETED so the next call retries a failed lazy
 * resolve instead of caching the failure forever.
 */
export function createAsyncManifestMemo<T>(
	derive: (manifest: SSRManifest) => Promise<T>,
): AsyncManifestMemo<T> {
	const cache = new WeakMap<SSRManifest, Promise<T>>();
	return {
		get(manifest) {
			let promise = cache.get(manifest);
			if (!promise) {
				promise = derive(manifest);
				cache.set(manifest, promise);
				promise.catch(() => {
					// Only delete if the entry wasn't already replaced/invalidated.
					if (cache.get(manifest) === promise) {
						cache.delete(manifest);
					}
				});
			}
			return promise;
		},
		invalidate(manifest) {
			cache.delete(manifest);
		},
	};
}
