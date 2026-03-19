import { collectPropagatedHeadParts } from '../../../../core/head-propagation/buffer.js';
import {
	getPropagationHint as getHint,
	isPropagatingHint,
} from '../../../../core/head-propagation/resolver.js';
import {
	shouldRenderInstruction as shouldRenderInstructionByPolicy,
	type HeadInstructionRenderState,
} from '../../../../core/head-propagation/policy.js';
import type { SSRResult } from '../../../../types/public/internal.js';
import type { AstroComponentFactory } from '../astro/factory.js';
import { isHeadAndContent } from '../astro/head-and-content.js';

export function getPropagationHint(result: SSRResult, factory: AstroComponentFactory) {
	return getHint(result, factory);
}

export function registerIfPropagating(input: {
	result: SSRResult;
	factory: AstroComponentFactory;
	instance: {
		init(result: SSRResult): unknown | Promise<unknown>;
	};
}) {
	const hint = getHint(input.result, input.factory);
	if (isPropagatingHint(hint)) {
		// The runtime set supports both AstroComponentInstance and ServerIslandComponent,
		// and integrations may push objects that satisfy this minimal `init()` contract.
		input.result._metadata.propagators.add(
			input.instance as typeof input.result._metadata.propagators extends Set<infer T> ? T : never,
		);
	}
}

export async function bufferPropagatedHead(result: SSRResult): Promise<void> {
	const collected = await collectPropagatedHeadParts({
		propagators: result._metadata.propagators,
		result,
		isHeadAndContent,
	});
	result._metadata.extraHead.push(...collected);
}

export function shouldRenderInstruction(
	type: 'head' | 'maybe-head',
	state: HeadInstructionRenderState,
) {
	return shouldRenderInstructionByPolicy(type, state);
}

export function getInstructionRenderState(result: SSRResult): HeadInstructionRenderState {
	return {
		hasRenderedHead: result._metadata.hasRenderedHead,
		headInTree: result._metadata.headInTree,
		partial: result.partial,
	};
}
