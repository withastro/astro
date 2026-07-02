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
 * we also wait for those pending slot pre-renders. We keep initializing
 * propagators and waiting on slots until no new ones appear.
 *
 * Propagators are tracked in a `seen` set rather than read through a single
 * live `Set` iterator. A propagator can be registered after we have already
 * iterated to the end of the set (e.g. once a slot's `await` resolves), and a
 * `Set` iterator that has reported `done` would never report those late
 * additions.
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
			// Only initialize one propagator per `for` pass, then break back to
			// the `while`. This is not the same as letting the `for` run to its
			// end: `init()` above may have queued new slot pre-renders, and
			// breaking returns to step 1 so those are drained before the next
			// propagator is initialized.
			break;
		}

		if (!progressed) break;
	}

	return collectedHeadParts;
}
