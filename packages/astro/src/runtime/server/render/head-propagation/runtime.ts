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

/** Facade helper used by runtime adapters to read effective hint resolution. */
export function getPropagationHint(result: SSRResult, factory: AstroComponentFactory) {
	return getHint(result, factory);
}

/**
 * Registers an instance in the propagation set when its hint requires buffering.
 *
 * @example
 * A runtime-created component with `propagation: 'self'` is registered so its
 * styles can be collected before head flush.
 */
export function registerIfPropagating(
	result: SSRResult,
	factory: AstroComponentFactory,
	instance: {
		init(result: SSRResult): unknown | Promise<unknown>;
	},
) {
	// Fast path: explicit runtime hint is cheapest and most common for dynamic entries.
	if (factory.propagation === 'self' || factory.propagation === 'in-tree') {
		// The runtime set supports both AstroComponentInstance and ServerIslandComponent,
		// and integrations may push objects that satisfy this minimal `init()` contract.
		result._metadata.propagators.add(
			instance as typeof result._metadata.propagators extends Set<infer T> ? T : never,
		);
		return;
	}

	// Otherwise fall back to metadata (`.astro` compile/build analysis).
	if (factory.moduleId) {
		const hint = result.componentMetadata.get(factory.moduleId)?.propagation;
		if (isPropagatingHint(hint ?? 'none')) {
			result._metadata.propagators.add(
				instance as typeof result._metadata.propagators extends Set<infer T> ? T : never,
			);
		}
	}
}

export async function bufferPropagatedHead(result: SSRResult): Promise<void> {
	// Initialize potential propagators, then append all emitted head parts.
	const collected = await collectPropagatedHeadParts({
		propagators: result._metadata.propagators,
		result,
		isHeadAndContent,
	});
	result._metadata.extraHead.push(...collected);
}

/** Facade helper for render instruction gating (`head` vs `maybe-head`). */
export function shouldRenderInstruction(
	type: 'head' | 'maybe-head',
	state: HeadInstructionRenderState,
) {
	return shouldRenderInstructionByPolicy(type, state);
}

/** Projects `SSRResult` into the minimal state needed by instruction policy. */
export function getInstructionRenderState(result: SSRResult): HeadInstructionRenderState {
	return {
		hasRenderedHead: result._metadata.hasRenderedHead,
		headInTree: result._metadata.headInTree,
		partial: result.partial,
	};
}
