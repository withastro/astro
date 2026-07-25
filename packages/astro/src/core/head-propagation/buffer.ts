import type { SSRResult } from '../../types/public/internal.js';

export interface HeadPropagator {
	init(result: SSRResult): unknown | Promise<unknown>;
}

/**
 * Runs all registered propagators and collects the head HTML they emit.
 *
 * Components with head content are discovered as we go. Initializing one
 * propagator can register more of them: a component marked `in-tree` renders
 * its children, and one of those children may be a `self` component that emits
 * styles. Slots add a second way to find them — a slot whose markup contains an
 * `await` only reaches the components after that `await` once it resolves, so
 * the pending slot pre-renders are fully drained before moving on to the next
 * propagator.
 *
 * A single pass over the live `Set` reaches every late registration: a `Set`
 * iterator visits entries added during iteration (in insertion order), and
 * because slots are drained before the iterator advances, nothing can register
 * a propagator after the iterator has reported `done`.
 *
 * @example
 * If a layout initializes and discovers a nested component that also emits
 * `<link rel="stylesheet">`, both head chunks are collected before flush.
 */
export async function collectPropagatedHeadParts(input: {
	propagators: Set<HeadPropagator>;
	result: SSRResult;
	isHeadAndContent: (value: unknown) => value is { head: string };
}): Promise<string[]> {
	const collectedHeadParts: string[] = [];
	// Populated (only on propagation routes) by eager async slot pre-renders.
	const pendingSlotEvaluations = input.result._metadata?.pendingSlotEvaluations ?? [];

	// Resolving a pending slot pre-render runs the slot markup past its
	// `await`s, registering any propagators inside — and possibly queueing
	// deeper slot pre-renders, hence the loop.
	const drainPendingSlots = async () => {
		while (pendingSlotEvaluations.length > 0) {
			const batch = pendingSlotEvaluations.splice(0, pendingSlotEvaluations.length);
			await Promise.all(batch);
		}
	};

	// Keep this as a single pass over the live `Set` so collection stays O(N).
	// Draining pending slots before the iterator advances lets it discover
	// propagators registered by async slot evaluations.
	await drainPendingSlots();
	for (const propagator of input.propagators) {
		const returnValue = await propagator.init(input.result);
		// Only collect explicit head-bearing return values.
		if (input.isHeadAndContent(returnValue) && returnValue.head) {
			collectedHeadParts.push(returnValue.head);
		}
		// `init()` may have queued new slot pre-renders. Drain them before the
		// iterator advances so any propagators they register are appended while
		// the iterator is still active.
		await drainPendingSlots();
	}

	return collectedHeadParts;
}
