/**
 * Background cache stores the memory provider hands to the recording `waitUntil` below.
 * The provider stores a cache miss only once the cache copy of the body has been read to the
 * end, after `onRequest` has returned. A test that checks the cache straight after a miss
 * would otherwise race that store: an expected HIT fails, and an expected MISS passes
 * whether or not the entry was keyed correctly.
 */
const pendingStores: Promise<unknown>[] = [];

/**
 * Recording `waitUntil` hook, passed as an `App.render` option or on the provider context;
 * records each background cache store so tests can await it.
 */
export function waitUntil(promise: Promise<unknown>) {
	pendingStores.push(promise);
}

/**
 * Helper: wait for the background stores recorded so far. Call it after any cacheable
 * request whose stored entry a later assertion depends on, including assertions that a
 * different key or an uncacheable response is a MISS. Rejects if the stores have not settled
 * within 1000 ms.
 */
export async function settlePendingStores(): Promise<void> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error('cache store did not settle')), 1000);
	});
	try {
		await Promise.race([Promise.all(pendingStores.splice(0)), timeout]);
	} finally {
		clearTimeout(timer);
	}
}
