/**
 * Background cache stores the memory provider hands to the recording `waitUntil` below.
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
