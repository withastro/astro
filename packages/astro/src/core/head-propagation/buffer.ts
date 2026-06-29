import type { SSRResult } from '../../types/public/internal.js';

export interface HeadPropagator {
	init(result: SSRResult): unknown | Promise<unknown>;
}

/**
 * Runs all registered propagators and collects emitted head HTML strings.
 *
 * Discovery is a fixpoint: initializing one propagator can register more (the
 * `in-tree` -> `self` chain), and resolving a pending async slot pre-render can
 * register propagators that live behind an `await` in slot markup. We keep
 * draining both until neither produces new work — i.e. "wait until there are no
 * more propagators".
 *
 * A `seen` set is used instead of a single live `Set` iterator because a
 * propagator can be registered *after* an `await` boundary, at which point a
 * `Set` iterator that has already reported `done` would never observe it.
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
	const seen = new Set<HeadPropagator>();
	// Populated (only on propagation routes) by eager async slot pre-renders.
	const pendingSlotEvaluations = input.result._metadata?.pendingSlotEvaluations ?? [];

	while (true) {
		// 1. Drain async slot pre-renders first. Resolving them runs the slot
		//    markup past its `await`s, registering any propagators inside.
		if (pendingSlotEvaluations.length > 0) {
			const batch = pendingSlotEvaluations.splice(0, pendingSlotEvaluations.length);
			await Promise.all(batch);
			continue;
		}

		// 2. Initialize the next not-yet-seen propagator. `init()` may register
		//    further propagators or queue more slot evaluations.
		let progressed = false;
		for (const propagator of input.propagators) {
			if (seen.has(propagator)) continue;
			seen.add(propagator);
			progressed = true;

			const returnValue = await propagator.init(input.result);
			// Only collect explicit head-bearing return values.
			if (input.isHeadAndContent(returnValue) && returnValue.head) {
				collectedHeadParts.push(returnValue.head);
			}
			// Restart the loop so any work queued during `init()` is drained
			// before advancing.
			break;
		}

		if (!progressed) break;
	}

	return collectedHeadParts;
}
