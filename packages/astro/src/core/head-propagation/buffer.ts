import type { SSRResult } from '../../types/public/internal.js';

export interface HeadPropagator {
	init(result: SSRResult): unknown | Promise<unknown>;
}

export async function collectPropagatedHeadParts(input: {
	propagators: Set<HeadPropagator>;
	result: SSRResult;
	isHeadAndContent: (value: unknown) => value is { head: string };
}): Promise<string[]> {
	const collectedHeadParts: string[] = [];

	const iterator = input.propagators.values();
	while (true) {
		const { value, done } = iterator.next();
		if (done) {
			break;
		}

		const returnValue = await value.init(input.result);
		if (input.isHeadAndContent(returnValue) && returnValue.head) {
			collectedHeadParts.push(returnValue.head);
		}
	}

	return collectedHeadParts;
}
