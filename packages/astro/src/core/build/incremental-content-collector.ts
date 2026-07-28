/**
 * Side-channel used to attribute rendered content entries to the path being
 * generated. The prerender runtime and the build orchestrator live in the same
 * process but in different module instances (the runtime is bundled), so the
 * collector is stored on a `Symbol.for` global that both halves resolve to.
 *
 * `generate.ts` opens a collection around each path render; the content runtime
 * records every entry it renders (by root-relative `filePath`); the build then
 * folds those entries' render-graph hashes into the path's incremental cache
 * entry. Custom prerenderers that render out of process will not populate the
 * collector, so those paths simply record no content entries.
 */
const COLLECTOR_KEY = Symbol.for('astro:incremental-content-entries');

interface CollectorGlobal {
	[COLLECTOR_KEY]?: Set<string>;
}

function collectorHost(): CollectorGlobal {
	return globalThis as unknown as CollectorGlobal;
}

/** Start collecting the content entries rendered on the current path. */
export function beginContentEntryCollection(): void {
	collectorHost()[COLLECTOR_KEY] = new Set();
}

/** Record that a content entry was rendered, keyed by its root-relative `filePath`. */
export function recordContentEntryRender(filePath: string | undefined): void {
	if (!filePath) return;
	collectorHost()[COLLECTOR_KEY]?.add(filePath);
}

/**
 * Finish collection and return the rendered entries, or `undefined` when no
 * collection was active (so callers can distinguish "nothing rendered" from
 * "not tracked").
 */
export function endContentEntryCollection(): string[] | undefined {
	const host = collectorHost();
	const entries = host[COLLECTOR_KEY];
	host[COLLECTOR_KEY] = undefined;
	return entries ? [...entries] : undefined;
}
