import type { SSRResult } from '../../types/public/internal.js';

export interface HeadPropagator {
	init(result: SSRResult): unknown | Promise<unknown>;
}

/**
 * Runs all registered propagators and collects emitted head HTML strings.
 *
 * This iterates the live `Set`, so propagators discovered during iteration
 * are also processed in the same pass.
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

	// Keep the iterator live so newly-added propagators are seen.
	const iterator = input.propagators.values();
	while (true) {
		const { value, done } = iterator.next();
		if (done) {
			break;
		}

		const returnValue = await value.init(input.result);
		// Only collect explicit head-bearing return values.
		if (input.isHeadAndContent(returnValue) && returnValue.head) {
			collectedHeadParts.push(returnValue.head);
		}
	}

	return collectedHeadParts;
}
