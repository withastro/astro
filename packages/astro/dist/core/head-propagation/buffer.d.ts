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
export declare function collectPropagatedHeadParts(input: {
	propagators: Set<HeadPropagator>;
	result: SSRResult;
	isHeadAndContent: (value: unknown) => value is {
		head: string;
	};
}): Promise<string[]>;
