import type { SSRManifest } from '../app/types.js';

/**
 * Bit flags for pipeline features that handler classes register as
 * "used" when a custom `src/fetch.ts` fetch handler is in play. After the
 * first request (dev) or at runtime (prod SSR), we compare against the
 * manifest to warn about features the user configured but forgot to
 * include in their custom pipeline.
 */
export const PipelineFeatures = {
	redirects: 1 << 0,
	sessions: 1 << 1,
	actions: 1 << 2,
	middleware: 1 << 3,
	i18n: 1 << 4,
	cache: 1 << 5,
} as const;

/** All feature bits ORed together. Keep next to `PipelineFeatures` so
 *  new flags are hard to forget. */
export const ALL_PIPELINE_FEATURES =
	PipelineFeatures.redirects |
	PipelineFeatures.sessions |
	PipelineFeatures.actions |
	PipelineFeatures.middleware |
	PipelineFeatures.i18n |
	PipelineFeatures.cache;

// Per-manifest scoping (plan-foundation §6.3): two Apps constructed over the
// same manifest object (the cloudflare custom-fetch worker) share this bitmask
// — the bits accumulate from the same renders the warning already observed.
const usedFeatures = new WeakMap<SSRManifest, { bits: number }>();

/** ORs a feature bit into the manifest's used-features bitmask. */
export function markFeatureUsed(manifest: SSRManifest, feature: number): void {
	const entry = usedFeatures.get(manifest);
	if (entry) {
		entry.bits |= feature;
	} else {
		usedFeatures.set(manifest, { bits: feature });
	}
}

/** The used-features bitmask for a manifest; `0` when nothing was marked. */
export function getUsedFeatures(manifest: SSRManifest): number {
	return usedFeatures.get(manifest)?.bits ?? 0;
}

/**
 * Internal raw setter — exists only so the transitional `Pipeline` bridge can
 * expose `usedFeatures` as a get/set pair (`|=` is get-then-SET). Handlers use
 * `markFeatureUsed`.
 */
export function setUsedFeatures(manifest: SSRManifest, bits: number): void {
	usedFeatures.set(manifest, { bits });
}
