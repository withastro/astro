/**
 * Background cache stores the memory provider hands to the recording `waitUntil` below.
 */
const pendingStores: Promise<unknown>[] = [];

/**
 * Render option: records the background cache store so tests can await it.
 */
export function waitUntil(promise: Promise<unknown>) {
	pendingStores.push(promise);
}

/**
 * Helper: wait for the background stores recorded so far. Call it after any cacheable
 * request whose stored entry a later assertion depends on, including assertions that a
 * different key or an uncacheable response is a MISS.
 */
export async function settlePendingStores(): Promise<void> {
	await Promise.all(pendingStores.splice(0));
}
