import type { SSRManifest } from '../app/types.js';

/**
 * Tracks which pipeline steps ran, by name, so `BaseApp` can warn when a custom `src/fetch.ts`
 * skips a step the project needs. Names are the built-in steps (`'redirects'`, `'middleware'`)
 * and the names of handlers registered with `api.astroRouter.addFetchHandler()`, which match the
 * `astro/fetch` function a custom handler calls (e.g. `'sessions'` for `sessions()`).
 *
 * Scoped per manifest: two Apps constructed over the same manifest object (e.g. the cloudflare
 * custom-fetch worker) share the record.
 */
const usedHandlers = new WeakMap<SSRManifest, Set<string>>();
// `handleRequest` runs every step, so it marks the whole manifest instead of each name.
const allHandlersUsed = new WeakSet<SSRManifest>();

/** Records that the pipeline step `name` ran for `manifest`. */
export function markHandlerUsed(manifest: SSRManifest, name: string): void {
	const used = usedHandlers.get(manifest);
	if (used) {
		used.add(name);
	} else {
		usedHandlers.set(manifest, new Set([name]));
	}
}

/** Records that every pipeline step ran for `manifest`. */
export function markAllHandlersUsed(manifest: SSRManifest): void {
	allHandlersUsed.add(manifest);
}

/** Whether the pipeline step `name` ran for `manifest`. */
export function isHandlerUsed(manifest: SSRManifest, name: string): boolean {
	return allHandlersUsed.has(manifest) || (usedHandlers.get(manifest)?.has(name) ?? false);
}
